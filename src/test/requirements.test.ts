import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { GET as medicationsGet, POST as medicationsPost } from '@/app/api/medications/route';
import { POST as ordersPost } from '@/app/api/orders/route';
import { PATCH as orderPatch } from '@/app/api/orders/[id]/route';
import { UserModel, MedicationModel, OrderModel } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getAuthUser } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/db', () => ({
    connectDB: vi.fn(),
    UserModel: {
        findOne: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
    MedicationModel: {
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        exists: vi.fn(),
    },
    OrderModel: {
        find: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock('mongoose', () => {
    const session = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
    };
    return {
        default: {
            startSession: vi.fn().mockResolvedValue(session),
        },
        Schema: vi.fn(),
        model: vi.fn(),
        models: {},
    };
});

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password_bcrypt'),
    },
}));

vi.mock('@/lib/auth', () => ({
    getAuthUser: vi.fn(),
    setAuthCookie: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn().mockReturnValue({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
}));

describe('iApteca Requirements Tests (Vymogy.md)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Тест 1: Валідація пошуку та продуктивності (FR-04, NFR-04)
    it('Тест 1: Пошук повертає результати і виконується < 200 мс', async () => {
        // Given: У базі даних існують препарати з назвами "Анальгін" та "Анаферон".
        const mockMedications = [{ name: 'Анальгін' }, { name: 'Анаферон' }];
        const mockLean = vi.fn().mockResolvedValue(mockMedications);
        const mockLimit = vi.fn().mockReturnValue({ lean: mockLean });
        const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit });
        (MedicationModel.find as Mock).mockReturnValue({ skip: mockSkip });

        // When: Користувач вводить у поле пошуку запит "Ана".
        const start = performance.now();
        const req = new Request('http://localhost/api/medications?search=Ана');
        const res = await medicationsGet(req);
        const end = performance.now();
        const data = await res.json();

        // Then: Система повертає список, що містить обидва препарати. 
        // Час від моменту надсилання запиту до отримання результату не перевищує 200 мс.
        expect(data).toHaveLength(2);
        expect(data[0].name).toContain('Анал');
        expect(data[1].name).toContain('Анаф');
        expect(end - start).toBeLessThan(200);
    });

    // Тест 2: Безпека зберігання паролів (FR-01, NFR-01)
    it('Тест 2: Паролі зберігаються у вигляді хешу bcrypt', async () => {
        // Given: Новий користувач заповнює форму реєстрації з паролем "SuperSecret123".
        (UserModel.findOne as Mock).mockResolvedValue(null);
        (UserModel.create as Mock).mockResolvedValue({ _id: 'user123', role: 'CUSTOMER' });

        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone: '+380630000000', password: 'SuperSecret123', name: 'John' }),
        });

        // When: Система зберігає дані користувача в базу даних MongoDB.
        await registerPost(req);

        // Then: У відповідному полі бази даних замість "SuperSecret123" зберігається рядок (хеш), згенерований алгоритмом bcrypt.
        expect(bcrypt.hash).toHaveBeenCalledWith('SuperSecret123', 10);
        expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({
            password: 'hashed_password_bcrypt'
        }));
    });

    // Тест 3: Атомарність створення замовлення (FR-09, NFR-09)
    it('Тест 3: Замовлення створюється зі статусом PENDING', async () => {
        // Given: Авторизований покупець має в кошику 2 товари.
        (getAuthUser as Mock).mockResolvedValue({ _id: 'user123', role: 'CUSTOMER' });
        const mockMed1 = { _id: 'med1', name: 'Товар 1', stock: 10, save: vi.fn() };
        const mockMed2 = { _id: 'med2', name: 'Товар 2', stock: 5, save: vi.fn() };
        
        (MedicationModel.findById as Mock).mockImplementation((id) => ({
            session: vi.fn().mockResolvedValue(id === 'med1' ? mockMed1 : mockMed2)
        }));
        (OrderModel.create as Mock).mockResolvedValue([{ _id: 'order_unique_id' }]);

        const orderData = {
            items: [
                { medication: 'med1', quantity: 1, price: 100 },
                { medication: 'med2', quantity: 1, price: 200 }
            ],
            total: 300
        };

        // When: Покупець натискає кнопку "Оформити замовлення".
        const req = new Request('http://localhost/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        const res = await ordersPost(req);
        const data = await res.json();

        // Then: В базі даних створюється новий документ Order з унікальним ідентифікатором, 
        // повним переліком товарів та автоматичним статусом "PENDING".
        expect(res.status).toBe(200);
        expect(OrderModel.create).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                status: 'PENDING',
                items: expect.arrayContaining([
                    expect.objectContaining({ medication: 'med1' }),
                    expect.objectContaining({ medication: 'med2' })
                ])
            })
        ]), expect.anything());
        expect(data._id).toBe('order_unique_id');
    });

    // Тест 4: Відновлення залишків при скасуванні (FR-14, NFR-14)
    it('Тест 4: Сток повертається при скасуванні замовлення', async () => {
        // Given: Існує замовлення на 5 одиниць товару "Цитрамон", а його поточний залишок на складі (stock) становить 50 одиниць.
        (getAuthUser as Mock).mockResolvedValue({ _id: 'admin123', role: 'ADMIN' });
        const mockOrder = { 
            _id: 'order123', 
            status: 'PENDING', 
            items: [{ medication: 'citramon_id', quantity: 5 }] 
        };
        (OrderModel.findById as Mock).mockReturnValue({ session: vi.fn().mockResolvedValue(mockOrder) });
        const mockMedUpdate = { session: vi.fn().mockResolvedValue({}) };
        (MedicationModel.findByIdAndUpdate as Mock).mockReturnValue(mockMedUpdate);

        // When: Адміністратор змінює статус цього замовлення на "CANCELLED".
        const req = new Request('http://localhost/api/orders/order123', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'CANCELLED' }),
        });

        await orderPatch(req, { params: Promise.resolve({ id: 'order123' }) });

        // Then: Система автоматично збільшує залишок "Цитрамону" в базі даних на 5 одиниць.
        expect(MedicationModel.findByIdAndUpdate).toHaveBeenCalledWith('citramon_id', { $inc: { stock: 5 } });
    });

    // Тест 5: Контроль доступу на основі ролей (FR-11, NFR-11)
    it('Тест 5: Користувач CUSTOMER не може створювати препарати', async () => {
        // Given: Користувач авторизований у системі з роллю "CUSTOMER".
        (getAuthUser as Mock).mockResolvedValue({ _id: 'user123', role: 'CUSTOMER' });

        // When: Користувач намагається надіслати запит на створення нового препарату через API /api/admin/medications.
        // Примітка: В нашому проекті цей функціонал за адресою /api/medications (POST)
        const req = new Request('http://localhost/api/medications', {
            method: 'POST',
            body: JSON.stringify({ name: 'Новий препарат' }),
        });

        const res = await medicationsPost(req);

        // Then: Система відхиляє запит, повертаючи статус помилки 403 (Forbidden).
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('Unauthorized');
    });
});
