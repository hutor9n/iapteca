# Звіт з логування та метрик iApteca

## 1. Система логування

Було реалізовано 10 подій логування з різними рівнями.

LOG-01: Успішна авторизація
Рівень:    INFO
Де:        POST /api/auth/login
Що пишемо: timestamp, event="user.login", user_id, ip
Чому саме цей рівень: нормальна бізнес-подія, яку треба фіксувати в аудиті

LOG-02: Невдала спроба входу
Рівень:    WARN
Де:        POST /api/auth/login
Що пишемо: timestamp, event="user.login_failed", phone, ip
Чому саме цей рівень: сама по собі не критична, але серія таких — загроза (потенційний brute-force)

LOG-03: Реєстрація нового користувача
Рівень:    INFO
Де:        POST /api/auth/register
Що пишемо: timestamp, event="user.register", user_id, phone, name, ip
Чому саме цей рівень: важлива бізнес-метрика росту та нормальна подія

LOG-04: Створення замовлення
Рівень:    INFO
Де:        POST /api/orders
Що пишемо: timestamp, event="order.created", user_id, order_id, total
Чому саме цей рівень: ключова бізнес-операція для відстеження

LOG-05: Зміна статусу замовлення
Рівень:    INFO
Де:        PATCH /api/orders/[id]
Що пишемо: timestamp, event="order.status_changed", order_id, status, admin_id
Чому саме цей рівень: відстеження життєвого циклу замовлень для аудиту

LOG-06: Створення категорії
Рівень:    INFO
Де:        POST /api/categories
Що пишемо: timestamp, event="category.created", admin_id, category_id, name
Чому саме цей рівень: аудит дій адміністратора

LOG-07: Помилка підключення до бази даних
Рівень:    ERROR
Де:        src/lib/db.ts
Що пишемо: timestamp, event="db.connection_failed", error_message
Чому саме цей рівень: система не може виконати операцію, потрібна негайна реакція розробника

LOG-08: Спроба доступу без прав
Рівень:    WARN
Де:        GET /api/admin/users
Що пишемо: timestamp, event="admin.access_denied", user_id, path
Чому саме цей рівень: порушення безпеки доступу, може свідчити про спробу атаки

LOG-09: Отримання списку категорій
Рівень:    DEBUG
Де:        GET /api/categories
Що пишемо: timestamp, event="categories.fetched", count
Чому саме цей рівень: деталі для налагодження роботи бекенду, не потрібні у звичайних логах

LOG-10: Пошук медикаментів
Рівень:    INFO
Де:        src/app/page.tsx
Що пишемо: timestamp, event="medications.searched", query
Чому саме цей рівень: відстеження попиту та активності користувачів

## 2. Захист PII (Personally Identifiable Information)

PII-01: Форма входу та реєстрації
Дані:        password
Ризик:       Витік пароля у відкритому вигляді - критична вразливість
Рішення:     Маскування
Приклад:
  До:    { password: "SuperSecret123!" }
  Після: { password: "***" }

PII-02: Реєстрація
Дані:        email
Ризик:       Розкриття особистої пошти користувача
Рішення:     Маскування
Приклад:
  До:    { email: "john@doe.com" }
  Після: { email: "j***@doe.com" }

PII-03: Профіль та Реєстрація
Дані:        phone
Ризик:       Витік номера телефону користувача
Рішення:     Маскування
Приклад:
  До:    { phone: "+380631234567" }
  Після: { phone: "+38063****567" }

## 3. Базові метрики

MTR-01: http_requests_total
Тип:         Counter
Що вимірює:  Загальна кількість HTTP-запитів до сервісу
Labels:      method, path
Пов'язана NFR: NFR-03, NFR-04

MTR-02: http_request_duration_ms
Тип:         Histogram
Що вимірює:  Час обробки HTTP-запиту в мілісекундах
Labels:      path
Пов'язана NFR: NFR-03, NFR-04

MTR-03: active_user_sessions
Тип:         Gauge
Що вимірює:  Кількість активних сесій у поточний момент (авторизованих користувачів)
Labels:      -
Пов'язана NFR: NFR-02

MTR-04: order_errors_total
Тип:         Counter
Що вимірює:  Кількість помилок при створенні замовлень
Labels:      error_type
Пов'язана NFR: NFR-09

MTR-05: db_connection_status
Тип:         Gauge
Що вимірює:  Статус підключення до БД (1 - підключено, 0 - помилка)
Labels:      -
Пов'язана NFR: General Reliability

## 4. Матриця зв'язків: Метрики <=> NFR <=> SLO

| Метрика | NFR | SLI (що вимірюємо) | SLO (ціль) |
|---|---|---|---|
| http_requests_total | NFR-03 | error rate = 5xx / total | <= 0.5% |
| http_request_duration_ms | NFR-03 | Latency p95 for SSR | <= 800ms |
| http_request_duration_ms | NFR-04 | Latency p95 for Search | <= 200ms |
| active_user_sessions | NFR-02 | поточна кількість сесій | <= 10,000 |
| order_errors_total | NFR-09 | % невдалих транзакцій | 0% |
