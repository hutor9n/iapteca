import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { GET as medicationsGet, POST as medicationsPost } from '@/app/api/medications/route';
import { POST as ordersPost } from '@/app/api/orders/route';
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
    },
    MedicationModel: {
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
    },
    OrderModel: {
        find: vi.fn(),
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
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

describe('iApteca Requirements Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test 1: Search validation (FR-04)
    it('should filter medications by search term', async () => {
        const mockMedications = [{ name: 'Analgin' }];
        const mockLean = vi.fn().mockResolvedValue(mockMedications);
        const mockLimit = vi.fn().mockReturnValue({ lean: mockLean });
        (MedicationModel.find as Mock).mockReturnValue({ limit: mockLimit });

        const req = new Request('http://localhost/api/medications?search=Ana');
        const res = await medicationsGet(req);
        const data = await res.json();

        expect(MedicationModel.find).toHaveBeenCalledWith(expect.objectContaining({
            name: { $regex: 'Ana', $options: 'i' }
        }));
        expect(data).toEqual(mockMedications);
    });

    // Test 2: Password storage security (FR-01, NFR-01)
    it('should hash password during registration', async () => {
        (UserModel.findOne as Mock).mockResolvedValue(null);
        (UserModel.create as Mock).mockResolvedValue({ _id: 'user123', role: 'CUSTOMER' });

        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone: '1234567890', password: 'password123', name: 'John' }),
        });

        await registerPost(req);

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({
            password: 'hashed_password'
        }));
    });

    // Test 3: Order creation (FR-09)
    it('should create an order with correct items and status', async () => {
        const mockUser = { _id: 'user123', role: 'CUSTOMER' };
        (getAuthUser as Mock).mockResolvedValue(mockUser);
        (OrderModel.create as Mock).mockResolvedValue({ _id: 'order123' });

        const orderData = {
            items: [{ medication: 'med1', quantity: 2, price: 100 }],
            total: 200,
            user: 'user123'
        };

        const req = new Request('http://localhost/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        await ordersPost(req);

        expect(OrderModel.create).toHaveBeenCalledWith(expect.objectContaining(orderData));
    });

    // Test 4: Role-based access control (FR-11, NFR-11)
    it('should block non-admin users from creating medications', async () => {
        (getAuthUser as Mock).mockResolvedValue({ _id: 'user123', role: 'CUSTOMER' });

        const req = new Request('http://localhost/api/medications', {
            method: 'POST',
            body: JSON.stringify({ name: 'New Med' }),
        });

        const res = await medicationsPost(req);
        expect(res.status).toBe(403);
        expect(MedicationModel.create).not.toHaveBeenCalled();
    });

    // Test 5: Admin access to medications (FR-11)
    it('should allow admin users to create medications', async () => {
        (getAuthUser as Mock).mockResolvedValue({ _id: 'admin123', role: 'ADMIN' });
        (MedicationModel.create as Mock).mockResolvedValue({ _id: 'med123' });

        const req = new Request('http://localhost/api/medications', {
            method: 'POST',
            body: JSON.stringify({ name: 'New Med' }),
        });

        const res = await medicationsPost(req);
        expect(res.status).toBe(200);
        expect(MedicationModel.create).toHaveBeenCalled();
    });
});
