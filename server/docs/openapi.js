// Static OpenAPI 3.0 document for the whole API (mobile + admin).
// Kept as a plain JS object (not swagger-jsdoc) so every route is documented
// in one place, independent of comment blocks scattered across route files.

const okEnvelope = (extra = {}) => ({
    type: 'object',
    properties: { status: { type: 'boolean', example: true }, ...extra },
});

const errorEnvelope = {
    type: 'object',
    properties: {
        status: { type: 'boolean', example: false },
        message: { type: 'string' },
    },
};

const paginated = (itemsSchema) => okEnvelope({
    data: { type: 'array', items: itemsSchema },
    total: { type: 'integer' },
    limit: { type: 'integer' },
    page: { type: 'integer' },
});

const param = (name, { where = 'query', type = 'string', required = false, description } = {}) => ({
    name, in: where, required, description, schema: { type },
});

const jsonBody = (schema) => ({
    required: true,
    content: { 'application/json': { schema } },
});

const responses = (map) => {
    const out = {};
    for (const [code, schema] of Object.entries(map)) {
        out[code] = {
            description: code === '200' || code === '201' ? 'Success' : 'Error',
            content: { 'application/json': { schema } },
        };
    }
    return out;
};

const bearerAuth = [{ bearerAuth: [] }];

const orderSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        status: { type: 'string', enum: ['created', 'accepted', 'arrived', 'on_way', 'completed', 'cancelled_by_user', 'cancelled_by_driver'] },
        payment_type: { type: 'string' },
        base_price: { type: 'number' },
        waiting_price: { type: 'number' },
        total_price: { type: 'number' },
        start_address: { type: 'string' },
        end_address: { type: 'string', nullable: true },
        distance_km: { type: 'number' },
        created_at: { type: 'string', format: 'date-time' },
        start_lat: { type: 'number' },
        start_lng: { type: 'number' },
        end_lat: { type: 'number', nullable: true },
        end_lng: { type: 'number', nullable: true },
    },
};

const adminOrderSchema = {
    allOf: [orderSchema, {
        type: 'object',
        properties: {
            client_id: { type: 'integer' },
            client_name: { type: 'string' },
            client_phone: { type: 'string' },
            driver_id: { type: 'integer', nullable: true },
            driver_first_name: { type: 'string', nullable: true },
            driver_last_name: { type: 'string', nullable: true },
            driver_phone: { type: 'string', nullable: true },
        },
    }],
};

const driverSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        phone: { type: 'string' },
        auto_number: { type: 'string' },
        auto_year: { type: 'integer' },
        is_active: { type: 'boolean' },
        park: { type: 'string', nullable: true },
        city_id: { type: 'integer', nullable: true },
        city_name: { type: 'string', nullable: true },
        marka_name: { type: 'string', nullable: true },
        model_name: { type: 'string', nullable: true },
        balance: { type: 'number' },
        completed_orders: { type: 'integer' },
    },
};

const applicationSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        city_id: { type: 'integer', nullable: true },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        phone: { type: 'string' },
        birthday: { type: 'string', format: 'date', nullable: true },
        auto_number: { type: 'string', nullable: true },
        marka_id: { type: 'integer', nullable: true },
        model_id: { type: 'integer', nullable: true },
        auto_year: { type: 'integer', nullable: true },
        license_photo: { type: 'string', nullable: true },
        car_image: { type: 'string', nullable: true },
        park: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        rejection_reason: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const pricingSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        city_id: { type: 'integer' },
        base_price: { type: 'number' },
        price_per_km: { type: 'number' },
        free_wait_min: { type: 'number' },
        wait_price_min: { type: 'number' },
        updated_at: { type: 'string', format: 'date-time' },
    },
};

const teamMemberSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        phone: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'operator'] },
        is_active: { type: 'boolean' },
    },
};

const clientSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        full_name: { type: 'string' },
        phone: { type: 'string' },
        avatar: { type: 'string', nullable: true },
        is_blocked: { type: 'boolean' },
        blocked_reason: { type: 'string', nullable: true },
        blocked_at: { type: 'string', format: 'date-time', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        total_orders: { type: 'integer' },
        completed_orders: { type: 'integer' },
        total_spent: { type: 'number' },
    },
};

const clientOrderSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        start_address: { type: 'string' },
        end_address: { type: 'string', nullable: true },
        distance_km: { type: 'number' },
        payment_type: { type: 'string' },
        total_price: { type: 'number' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        driver_first_name: { type: 'string', nullable: true },
        driver_last_name: { type: 'string', nullable: true },
    },
};

const paymentSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        order_id: { type: 'integer', nullable: true },
        amount: { type: 'number' },
        payment_type: { type: 'string' },
        status: { type: 'string', enum: ['paid', 'refunded'] },
        refund_note: { type: 'string', nullable: true },
        refunded_at: { type: 'string', format: 'date-time', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        client_id: { type: 'integer', nullable: true },
        client_name: { type: 'string', nullable: true },
        driver_id: { type: 'integer', nullable: true },
        driver_first_name: { type: 'string', nullable: true },
        driver_last_name: { type: 'string', nullable: true },
    },
};

const adminCitySchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        name_tm: { type: 'string' },
        name_ru: { type: 'string' },
        name_en: { type: 'string' },
    },
};

const adminSettingsSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        company_name: { type: 'string' },
        support_phone: { type: 'string' },
        timezone: { type: 'string' },
        default_lang: { type: 'string', enum: ['tk', 'ru'] },
        default_currency: { type: 'string', enum: ['TMT', 'USD'] },
        distance_unit: { type: 'string', enum: ['km', 'mi'] },
        date_format: { type: 'string', enum: ['DD.MM.YYYY', 'YYYY-MM-DD'] },
        updated_at: { type: 'string', format: 'date-time', nullable: true },
    },
};

const notifPrefRowSchema = {
    type: 'object',
    properties: {
        key: { type: 'string' },
        push: { type: 'boolean' },
        sms: { type: 'boolean' },
        email: { type: 'boolean' },
    },
};

const notifPrefsSchema = {
    type: 'object',
    properties: {
        admin_id: { type: 'integer' },
        rows: { type: 'array', items: notifPrefRowSchema },
        quiet_hours_enabled: { type: 'boolean' },
        quiet_hours_start: { type: 'string', example: '22:00' },
        quiet_hours_end: { type: 'string', example: '07:00' },
        updated_at: { type: 'string', format: 'date-time', nullable: true },
    },
};

const reviewSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        order_id: { type: 'integer' },
        user_id: { type: 'integer' },
        taxi_id: { type: 'integer' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const orderMessageSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        order_id: { type: 'integer' },
        sender_type: { type: 'string', enum: ['client', 'driver'] },
        sender_id: { type: 'integer', nullable: true },
        body: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const sosAlertSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        order_id: { type: 'integer', nullable: true },
        user_id: { type: 'integer', nullable: true },
        taxi_id: { type: 'integer', nullable: true },
        phone: { type: 'string' },
        note: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] },
        created_at: { type: 'string', format: 'date-time' },
        lat: { type: 'number' },
        lng: { type: 'number' },
    },
};

const balanceRequestSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        status: { type: 'string', enum: ['pending', 'confirmed', 'rejected'] },
        amount: { type: 'number', nullable: true },
        operator_id: { type: 'integer', nullable: true },
        reject_reason: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        user: { type: 'object', nullable: true, properties: { full_name: { type: 'string' }, phone: { type: 'string' } } },
    },
};

const balanceRequestMessageSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        request_id: { type: 'integer' },
        sender_type: { type: 'string', enum: ['user', 'taxi', 'admin'] },
        sender_id: { type: 'integer' },
        message: { type: 'string', nullable: true },
        photo_url: { type: 'string', nullable: true },
        is_read: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const supportMessageSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        sender_type: { type: 'string', enum: ['user', 'admin'] },
        sender_id: { type: 'integer' },
        message: { type: 'string', nullable: true },
        photo_url: { type: 'string', nullable: true },
        is_read: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
    },
};

const supportThreadSchema = {
    type: 'object',
    properties: {
        user_id: { type: 'integer' },
        full_name: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
        last_message: { type: 'string', nullable: true },
        last_message_at: { type: 'string', format: 'date-time', nullable: true },
        unread_count: { type: 'integer' },
    },
};

const paths = {
    // ── Users ──────────────────────────────────────────────────────────────
    '/api/users/createNew': {
        post: {
            tags: ['Users'], summary: 'Create a new user',
            requestBody: jsonBody({ type: 'object', properties: { phone_number: { type: 'string' }, firebase_uid: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ user: { type: 'object' } }), 500: errorEnvelope }),
        },
    },
    '/api/users/{id}': {
        get: {
            tags: ['Users'], summary: 'Get user by id',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ user: { type: 'object' } }), 404: errorEnvelope, 500: errorEnvelope }),
        },
        put: {
            tags: ['Users'], summary: 'Update user profile (multipart, optional avatar; also used to change the selected city)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { fullName: { type: 'string' }, cityId: { type: 'integer' }, avatar: { type: 'string', format: 'binary' } } } } } },
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 500: errorEnvelope }),
        },
        delete: {
            tags: ['Users'], summary: 'Delete user',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ message: { type: 'string' } }), 500: errorEnvelope }),
        },
    },
    '/api/users/sendCode': {
        post: {
            tags: ['Auth'], summary: 'Send OTP code to phone',
            requestBody: jsonBody({ type: 'object', required: ['phone'], properties: { phone: { type: 'string' } } }),
            responses: responses({ 200: okEnvelope({ message: { type: 'string' } }), 400: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/users/verifyOtp': {
        post: {
            tags: ['Auth'], summary: 'Verify OTP and receive a JWT',
            requestBody: jsonBody({ type: 'object', required: ['phone', 'code'], properties: { phone: { type: 'string' }, code: { type: 'string' } } }),
            responses: responses({
                200: okEnvelope({ token: { type: 'string' }, user: { type: 'object' }, taksi: { type: 'object', nullable: true } }),
                400: errorEnvelope, 500: errorEnvelope,
            }),
        },
    },

    // ── Cities ─────────────────────────────────────────────────────────────
    '/api/cities': {
        post: {
            tags: ['Cities'], summary: 'Create city',
            requestBody: jsonBody({ type: 'object', required: ['nameTm', 'nameRu', 'nameEn'], properties: { nameTm: { type: 'string' }, nameRu: { type: 'string' }, nameEn: { type: 'string' }, parentId: { type: 'integer', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ newCity: { type: 'object' } }), 400: errorEnvelope, 500: errorEnvelope }),
        },
        get: {
            tags: ['Cities'], summary: 'List all cities (flat + tree)',
            responses: responses({ 200: okEnvelope({ result: { type: 'object', properties: { cities: { type: 'array', items: { type: 'object' } }, tree: { type: 'array', items: { type: 'object' } } } } }), 500: errorEnvelope }),
        },
    },
    '/api/cities/{id}': {
        put: {
            tags: ['Cities'], summary: 'Update city',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['nameTm', 'nameRu', 'nameEn'], properties: { nameTm: { type: 'string' }, nameRu: { type: 'string' }, nameEn: { type: 'string' }, parentId: { type: 'integer', nullable: true } } }),
            responses: responses({ 200: okEnvelope({ updatedCity: { type: 'object' } }), 400: errorEnvelope, 404: errorEnvelope }),
        },
        delete: {
            tags: ['Cities'], summary: 'Delete city',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ deletedCity: { type: 'object' } }), 400: errorEnvelope, 404: errorEnvelope }),
        },
    },

    // ── Addresses ──────────────────────────────────────────────────────────
    '/api/addresses/create': {
        post: {
            tags: ['Addresses'], summary: 'Create address',
            requestBody: jsonBody({ type: 'object', required: ['userId', 'cityId', 'address'], properties: { userId: { type: 'integer' }, cityId: { type: 'integer' }, address: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' } } }),
            responses: responses({ 201: okEnvelope({ message: { type: 'object' } }), 409: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/addresses': {
        get: {
            tags: ['Addresses'], summary: 'Search/list addresses',
            parameters: [param('search'), param('userId', { type: 'integer' }), param('cityId', { type: 'integer' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: { type: 'object' } }, total: { type: 'integer' }, hasMore: { type: 'boolean' } }), 500: errorEnvelope }),
        },
    },
    '/api/addresses/{id}': {
        put: {
            tags: ['Addresses'], summary: 'Update address',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['address', 'cityId'], properties: { userId: { type: 'integer' }, address: { type: 'string' }, cityId: { type: 'integer' }, latitude: { type: 'number' }, longitude: { type: 'number' } } }),
            responses: responses({ 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } }, 400: errorEnvelope, 404: errorEnvelope }),
        },
        delete: {
            tags: ['Addresses'], summary: 'Delete address',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object' } } }), 409: errorEnvelope }),
        },
    },

    // ── Cars (Marka / Model) ───────────────────────────────────────────────
    '/api/cars/createMarka': {
        post: {
            tags: ['Cars'], summary: 'Create car brand (marka), optional image',
            requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, image: { type: 'string', format: 'binary' } } } } } },
            responses: responses({ 201: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope }),
        },
    },
    '/api/cars/{id}': {
        put: {
            tags: ['Cars'], summary: 'Update car brand',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, image: { type: 'string', format: 'binary' } } } } } },
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope }),
        },
        delete: {
            tags: ['Cars'], summary: 'Delete car brand',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 500: errorEnvelope }),
        },
    },
    '/api/cars': {
        get: {
            tags: ['Cars'], summary: 'List car brands with nested models',
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object' } } }), 500: errorEnvelope }),
        },
    },
    '/api/cars/createNewModel': {
        post: {
            tags: ['Cars'], summary: 'Create car model',
            requestBody: jsonBody({ type: 'object', required: ['markaId', 'name'], properties: { markaId: { type: 'integer' }, name: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope }),
        },
    },
    '/api/cars/model/{id}': {
        put: {
            tags: ['Cars'], summary: 'Update car model',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { name: { type: 'string' } } }),
            responses: responses({ 200: okEnvelope({ resutlt: { type: 'object' } }), 400: errorEnvelope }),
        },
        delete: {
            tags: ['Cars'], summary: 'Delete car model',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope }),
        },
    },
    '/api/cars/model': {
        get: {
            tags: ['Cars'], summary: 'List car models, optionally filtered by brand',
            parameters: [param('markaId', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object' } } }), 500: errorEnvelope }),
        },
    },

    // ── Services ───────────────────────────────────────────────────────────
    '/api/services': {
        post: {
            tags: ['Services'], summary: 'Create service',
            requestBody: jsonBody({ type: 'object', properties: { nameTm: { type: 'string' }, nameRu: { type: 'string' }, nameEn: { type: 'string' }, emoji: { type: 'string' } } }),
            responses: responses({ 200: { type: 'object', properties: { result: { type: 'object' } } }, 500: errorEnvelope }),
        },
        get: {
            tags: ['Services'], summary: 'List services',
            responses: responses({ 200: { type: 'object', properties: { result: { type: 'array', items: { type: 'object' } } } }, 500: errorEnvelope }),
        },
    },
    '/api/services/{id}': {
        put: {
            tags: ['Services'], summary: 'Update service',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { nameTm: { type: 'string' }, nameRu: { type: 'string' }, nameEn: { type: 'string' }, emoji: { type: 'string' } } }),
            responses: responses({ 200: { type: 'object', properties: { result: { type: 'object' } } }, 500: errorEnvelope }),
        },
        delete: {
            tags: ['Services'], summary: 'Delete service',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: { type: 'object', properties: { result: { type: 'object' } } }, 500: errorEnvelope }),
        },
    },

    // ── Taksi ──────────────────────────────────────────────────────────────
    '/api/taksi/createNew': {
        post: {
            tags: ['Taksi'], summary: 'Register a taxi/driver profile (multipart, up to 2 images)',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' },
                                birthday: { type: 'string', format: 'date' }, userId: { type: 'integer' }, cityId: { type: 'integer' },
                                autoNumber: { type: 'string' }, markaId: { type: 'integer' }, modelId: { type: 'integer' },
                                autoYear: { type: 'integer' }, isActive: { type: 'boolean' }, taksiPark: { type: 'string' },
                                avatar: { type: 'string', format: 'binary' }, carImage: { type: 'string', format: 'binary' },
                            },
                        },
                    },
                },
            },
            responses: responses({ 201: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/taksi/nearby': {
        get: {
            tags: ['Taksi'], summary: 'Find nearby taxis (PostGIS ST_DWithin)',
            parameters: [param('lat', { required: true, type: 'number' }), param('lng', { required: true, type: 'number' }), param('radius', { type: 'integer', description: 'meters, default 3000' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object' } } }), 400: errorEnvelope }),
        },
    },
    '/api/taksi/user/{userId}': {
        get: {
            tags: ['Taksi'], summary: 'Get taxi by user id',
            parameters: [param('userId', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 404: errorEnvelope }),
        },
    },
    '/api/taksi/{id}': {
        get: {
            tags: ['Taksi'], summary: 'Get taxi by id',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 500: errorEnvelope }),
        },
        put: {
            tags: ['Taksi'], summary: "Edit the driver's own profile (multipart, optional avatar/car image)",
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' },
                                birthday: { type: 'string', format: 'date' }, cityId: { type: 'integer' },
                                autoNumber: { type: 'string' }, markaId: { type: 'integer' }, modelId: { type: 'integer' },
                                autoYear: { type: 'integer' }, avatar: { type: 'string', format: 'binary' }, carImage: { type: 'string', format: 'binary' },
                            },
                        },
                    },
                },
            },
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 404: errorEnvelope, 500: errorEnvelope }),
        },
        delete: {
            tags: ['Taksi'], summary: 'Delete taxi',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object' } } }), 409: errorEnvelope }),
        },
    },

    // ── Balance ────────────────────────────────────────────────────────────
    '/api/balance/{id}/add': {
        post: {
            tags: ['Balance'], summary: 'Add to user balance',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['price', 'sendedName', 'confirmedName'], properties: { price: { type: 'number' }, sendedUserId: { type: 'integer', nullable: true }, sendedName: { type: 'string' }, confirmedName: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/balance/{id}/remove': {
        post: {
            tags: ['Balance'], summary: 'Remove from user balance (fails if it would go negative)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['price', 'sendedName', 'confirmedName'], properties: { price: { type: 'number' }, sendedUserId: { type: 'integer', nullable: true }, sendedName: { type: 'string' }, confirmedName: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ result: { type: 'object' } }), 409: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/balance/{id}/log': {
        get: {
            tags: ['Balance'], summary: 'Balance transaction log for a user',
            parameters: [
                param('id', { where: 'path', type: 'integer', required: true }),
                param('startDate'), param('endDate'), param('sortBy'), param('sort'), param('limit', { type: 'integer' }), param('page', { type: 'integer' }),
            ],
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 400: errorEnvelope }),
        },
    },
    '/api/balance/{id}': {
        get: {
            tags: ['Balance'], summary: 'Current balance for a user',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object', properties: { userId: { type: 'integer' }, price: { type: 'number' } } } }), 400: errorEnvelope }),
        },
    },

    // ── Orders (mobile) ────────────────────────────────────────────────────
    '/api/orders/price': {
        get: {
            tags: ['Orders'], summary: 'Calculate price for a distance (optionally per-city pricing)',
            parameters: [param('distanceKm', { required: true, type: 'number' }), param('cityId', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ price: { type: 'number' } }), 400: errorEnvelope }),
        },
    },
    '/api/orders': {
        post: {
            tags: ['Orders'], summary: 'Create order',
            requestBody: jsonBody({
                type: 'object', required: ['userId', 'startAddress', 'startLat', 'startLng'],
                properties: {
                    userId: { type: 'integer' }, startAddress: { type: 'string' }, endAddress: { type: 'string', nullable: true },
                    startLat: { type: 'number' }, startLng: { type: 'number' }, endLat: { type: 'number', nullable: true }, endLng: { type: 'number', nullable: true },
                    distanceKm: { type: 'number' }, paymentType: { type: 'string' }, basePrice: { type: 'number' },
                },
            }),
            responses: responses({ 201: okEnvelope({ result: orderSchema }), 400: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/orders/{id}': {
        get: {
            tags: ['Orders'], summary: 'Get order by id',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: orderSchema }), 400: errorEnvelope, 404: errorEnvelope }),
        },
    },
    '/api/orders/{id}/status': {
        patch: {
            tags: ['Orders'], summary: 'Update order status (transactional, appends a status log entry)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({
                type: 'object', required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['accepted', 'arrived', 'on_way', 'completed', 'cancelled_by_user', 'cancelled_by_driver'] },
                    taxiId: { type: 'integer' }, waitingPrice: { type: 'number' }, totalPrice: { type: 'number' },
                },
            }),
            responses: responses({ 200: okEnvelope({ result: orderSchema }), 400: errorEnvelope, 404: errorEnvelope }),
        },
    },
    '/api/orders/{id}/logs': {
        get: {
            tags: ['Orders'], summary: 'Status change history for an order',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object', properties: { status: { type: 'string' }, changed_at: { type: 'string', format: 'date-time' } } } } }), 400: errorEnvelope }),
        },
    },
    '/api/orders/{id}/track': {
        get: {
            tags: ['Orders'], summary: 'GPS track points recorded during the order',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, recorded_at: { type: 'string', format: 'date-time' } } } } }), 400: errorEnvelope }),
        },
    },
    '/api/orders/user/{userId}': {
        get: {
            tags: ['Orders'], summary: "List a user's orders",
            parameters: [
                param('userId', { where: 'path', type: 'integer', required: true }),
                param('status'), param('paymentType'), param('limit', { type: 'integer' }), param('page', { type: 'integer' }),
            ],
            responses: responses({ 200: paginated(orderSchema), 400: errorEnvelope }),
        },
    },
    '/api/orders/taxi/{taxiId}': {
        get: {
            tags: ['Orders'], summary: "List a driver's orders",
            parameters: [
                param('taxiId', { where: 'path', type: 'integer', required: true }),
                param('status'), param('paymentType'), param('limit', { type: 'integer' }), param('page', { type: 'integer' }),
            ],
            responses: responses({ 200: paginated(orderSchema), 400: errorEnvelope }),
        },
    },
    '/api/orders/city/{cityId}/active': {
        get: {
            tags: ['Orders'], summary: 'Active (status=created) orders in a city',
            parameters: [
                param('cityId', { where: 'path', type: 'integer', required: true }),
                param('limit', { type: 'integer' }), param('page', { type: 'integer' }),
            ],
            responses: responses({ 200: paginated(orderSchema), 400: errorEnvelope }),
        },
    },
    '/api/orders/{id}/messages': {
        get: {
            tags: ['Orders'], summary: 'Order chat history (driver ↔ client only)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: orderMessageSchema } }), 400: errorEnvelope }),
        },
        post: {
            tags: ['Orders'], summary: 'Send an order chat message (also broadcast via socket chat:message)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['senderType', 'body'], properties: { senderType: { type: 'string', enum: ['client', 'driver'] }, senderId: { type: 'integer', nullable: true }, body: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ result: orderMessageSchema }), 400: errorEnvelope }),
        },
    },
    '/api/orders/{id}/reviews': {
        post: {
            tags: ['Orders'], summary: 'Rate a completed order (one review per order)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['rating'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: reviewSchema }), 400: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },
    '/api/orders/taxi/{taxiId}/reviews': {
        get: {
            tags: ['Orders'], summary: "List a driver's reviews",
            parameters: [param('taxiId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(reviewSchema), 400: errorEnvelope }),
        },
    },
    '/api/orders/user/{userId}/reviews': {
        get: {
            tags: ['Orders'], summary: "List a user's submitted reviews",
            parameters: [param('userId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(reviewSchema), 400: errorEnvelope }),
        },
    },

    // ── Map ────────────────────────────────────────────────────────────────
    '/api/map/location/name': {
        get: {
            tags: ['Map'], summary: 'Reverse-geocode a point to the nearest named place',
            parameters: [param('lat', { required: true, type: 'number' }), param('lng', { required: true, type: 'number' }), param('radius', { type: 'number', description: 'meters, default 50, max 500' })],
            responses: responses({ 200: okEnvelope({ found: { type: 'boolean' }, name: { type: 'string' }, fclass: { type: 'string' }, distance_m: { type: 'number' } }), 400: errorEnvelope, 404: okEnvelope({ found: { type: 'boolean', example: false } }) }),
        },
    },

    // ── SOS ────────────────────────────────────────────────────────────────
    '/api/sos': {
        post: {
            tags: ['SOS'], summary: 'Trigger an SOS alert (REST fallback; also available via socket sos:trigger). Persists and notifies admins in the admin:sos room.',
            requestBody: jsonBody({
                type: 'object', required: ['phone', 'lat', 'lng'],
                properties: {
                    orderId: { type: 'integer', nullable: true }, userId: { type: 'integer', nullable: true }, taxiId: { type: 'integer', nullable: true },
                    phone: { type: 'string' }, note: { type: 'string', nullable: true, description: 'free text / category, e.g. emergency, fire, police' },
                    lat: { type: 'number' }, lng: { type: 'number' },
                },
            }),
            responses: responses({ 201: okEnvelope({ result: sosAlertSchema }), 400: errorEnvelope, 500: errorEnvelope }),
        },
    },

    // ── Balance requests (top-up approval workflow) ──────────────────────────
    '/api/balance-requests': {
        post: {
            tags: ['Balance Requests'], summary: 'Submit a balance top-up request (optionally with an opening chat message/photo)',
            requestBody: jsonBody({ type: 'object', required: ['userId'], properties: { userId: { type: 'integer' }, amount: { type: 'number', nullable: true }, message: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: balanceRequestSchema }), 400: errorEnvelope }),
        },
    },
    '/api/balance-requests/user/{userId}': {
        get: {
            tags: ['Balance Requests'], summary: "List a user's own balance top-up requests",
            parameters: [param('userId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(balanceRequestSchema), 400: errorEnvelope }),
        },
    },
    '/api/balance-requests/{id}/messages': {
        get: {
            tags: ['Balance Requests'], summary: 'Chat thread for a balance request',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: balanceRequestMessageSchema } }), 404: errorEnvelope }),
        },
        post: {
            tags: ['Balance Requests'], summary: 'Send a chat message on a balance request (client/taxi side)',
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['senderType', 'senderId'], properties: { senderType: { type: 'string', enum: ['user', 'taxi'] }, senderId: { type: 'integer' }, message: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: balanceRequestMessageSchema }), 400: errorEnvelope, 404: errorEnvelope }),
        },
    },

    // ── Support chat (user ↔ admin) ──────────────────────────────────────────
    '/api/support/messages': {
        post: {
            tags: ['Support'], summary: 'Send a message to admin support (one continuous thread per user)',
            requestBody: jsonBody({ type: 'object', required: ['userId'], properties: { userId: { type: 'integer' }, message: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: supportMessageSchema }), 400: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/support/user/{userId}/messages': {
        get: {
            tags: ['Support'], summary: "A user's support chat history with admin",
            parameters: [param('userId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: supportMessageSchema } }), 400: errorEnvelope }),
        },
    },

    // ── Misc ───────────────────────────────────────────────────────────────
    '/api/otp/device': {
        post: {
            tags: ['Misc'], summary: 'Register an FCM device token for OTP delivery',
            requestBody: jsonBody({ type: 'object', required: ['phone', 'token'], properties: { phone: { type: 'string' }, token: { type: 'string' } } }),
            responses: responses({ 200: okEnvelope(), 400: errorEnvelope, 500: errorEnvelope }),
        },
    },
    '/api/ping': {
        get: { tags: ['Misc'], summary: 'Health check', responses: responses({ 200: okEnvelope({ message: { type: 'string' } }) }) },
    },
    '/api/route': {
        get: {
            tags: ['Misc'], summary: 'OSRM routing proxy',
            parameters: [param('start', { required: true, description: 'lng,lat' }), param('end', { required: true, description: 'lng,lat' })],
            responses: responses({ 200: { type: 'object', description: 'GeoJSON route geometry from OSRM' }, 500: { type: 'object', properties: { error: { type: 'string' } } } }),
        },
    },
    '/search': {
        get: {
            tags: ['Misc'], summary: 'Search named places (PostGIS gis_osm_places_free_1)',
            parameters: [param('name', { required: true })],
            responses: responses({ 200: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, lng: { type: 'number' }, lat: { type: 'number' } } } }, 500: { type: 'object', properties: { error: { type: 'string' } } } }),
        },
    },

    // ── Public (web + mobile shared) ───────────────────────────────────────
    '/api/pricing/{cityId}': {
        get: {
            tags: ['Public'], summary: 'Get pricing config for a city',
            parameters: [param('cityId', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: pricingSchema }), 404: errorEnvelope }),
        },
    },
    '/api/driver-applications': {
        post: {
            tags: ['Public'], summary: 'Submit a driver signup application',
            requestBody: jsonBody({
                type: 'object', required: ['userId', 'firstName', 'lastName', 'phone'],
                properties: {
                    userId: { type: 'integer' }, cityId: { type: 'integer', nullable: true }, firstName: { type: 'string' }, lastName: { type: 'string' },
                    phone: { type: 'string' }, birthday: { type: 'string', format: 'date', nullable: true }, autoNumber: { type: 'string', nullable: true },
                    markaId: { type: 'integer', nullable: true }, modelId: { type: 'integer', nullable: true }, autoYear: { type: 'integer', nullable: true },
                    licensePhoto: { type: 'string', nullable: true }, carImage: { type: 'string', nullable: true }, park: { type: 'string', nullable: true },
                },
            }),
            responses: responses({ 201: okEnvelope({ result: applicationSchema }), 400: errorEnvelope }),
        },
    },

    // ── Admin: Auth ─────────────────────────────────────────────────────────
    '/api/admin/auth/login': {
        post: {
            tags: ['Admin · Auth'], summary: 'Admin/operator login',
            requestBody: jsonBody({ type: 'object', required: ['phone', 'password'], properties: { phone: { type: 'string' }, password: { type: 'string' } } }),
            responses: responses({ 200: okEnvelope({ token: { type: 'string' }, user: teamMemberSchema }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },
    '/api/admin/auth/me': {
        get: {
            tags: ['Admin · Auth'], summary: 'Current admin session', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ user: teamMemberSchema }), 401: errorEnvelope }),
        },
        put: {
            tags: ['Admin · Auth'], summary: 'Update own profile (name/phone/password)', security: bearerAuth,
            requestBody: jsonBody({ type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, newPassword: { type: 'string' }, currentPassword: { type: 'string', description: 'required when newPassword is set' } } }),
            responses: responses({ 200: okEnvelope({ user: teamMemberSchema }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },

    // ── Admin: Drivers ──────────────────────────────────────────────────────
    '/api/admin/drivers': {
        get: {
            tags: ['Admin · Drivers'], summary: 'List drivers', security: bearerAuth,
            parameters: [param('cityId', { type: 'integer' }), param('isActive', { type: 'boolean' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(driverSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/drivers/{userId}/status': {
        put: {
            tags: ['Admin · Drivers'], summary: "Set a driver's active status", security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } }),
            responses: responses({ 200: okEnvelope({ result: driverSchema }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },
    '/api/admin/drivers/{userId}/balance': {
        post: {
            tags: ['Admin · Drivers'], summary: "Adjust a driver's balance", security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['amount', 'direction'], properties: { amount: { type: 'number' }, direction: { type: 'string', enum: ['add', 'remove'] }, note: { type: 'string', nullable: true } } }),
            responses: responses({ 200: okEnvelope({ result: { type: 'object' } }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },

    // ── Admin: Clients ──────────────────────────────────────────────────────
    '/api/admin/clients': {
        get: {
            tags: ['Admin · Clients'], summary: 'List clients (with order stats)', security: bearerAuth,
            parameters: [param('search'), param('isBlocked', { type: 'boolean' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(clientSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/clients/{userId}/orders': {
        get: {
            tags: ['Admin · Clients'], summary: "List a client's orders", security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(clientOrderSchema), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },
    '/api/admin/clients/{userId}/status': {
        put: {
            tags: ['Admin · Clients'], summary: 'Block or unblock a client', security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['isBlocked'], properties: { isBlocked: { type: 'boolean' }, reason: { type: 'string', nullable: true, maxLength: 500 } } }),
            responses: responses({ 200: okEnvelope({ result: clientSchema }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },

    // ── Admin: Cities ───────────────────────────────────────────────────────
    '/api/admin/cities': {
        get: {
            tags: ['Admin · Cities'], summary: 'List cities', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: adminCitySchema } }), 401: errorEnvelope }),
        },
        post: {
            tags: ['Admin · Cities'], summary: 'Create city (admin role only)', security: bearerAuth,
            requestBody: jsonBody({ type: 'object', required: ['name_tm', 'name_ru', 'name_en'], properties: { name_tm: { type: 'string' }, name_ru: { type: 'string' }, name_en: { type: 'string' } } }),
            responses: responses({ 201: okEnvelope({ result: adminCitySchema }), 400: errorEnvelope, 401: errorEnvelope, 403: errorEnvelope }),
        },
    },

    // ── Admin: Orders / Reports ─────────────────────────────────────────────
    '/api/admin/orders': {
        get: {
            tags: ['Admin · Orders'], summary: 'List orders (joined with client + driver)', security: bearerAuth,
            parameters: [param('status'), param('cityId', { type: 'integer' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(adminOrderSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/orders/{id}/messages': {
        get: {
            tags: ['Admin · Orders'], summary: 'Read-only view of an order chat (order chat is driver ↔ client only; admin cannot post)', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: orderMessageSchema } }), 401: errorEnvelope }),
        },
    },
    '/api/admin/reports/orders': {
        get: {
            tags: ['Admin · Reports'], summary: 'Order/revenue summary + top drivers', security: bearerAuth,
            parameters: [param('from', { type: 'string' }), param('to', { type: 'string' }), param('cityId', { type: 'integer' })],
            responses: responses({
                200: okEnvelope({
                    result: {
                        type: 'object', properties: {
                            total_orders: { type: 'integer' }, completed: { type: 'integer' },
                            cancelled_by_user: { type: 'integer' }, cancelled_by_driver: { type: 'integer' },
                            revenue: { type: 'number' }, active_drivers: { type: 'integer' },
                            top_drivers: { type: 'array', items: { type: 'object' } },
                        },
                    },
                }), 401: errorEnvelope,
            }),
        },
    },
    '/api/admin/analytics/daily': {
        get: {
            tags: ['Admin · Reports'], summary: 'Daily delivered/failed counts', security: bearerAuth,
            parameters: [param('days', { type: 'integer', description: 'default 14' }), param('from'), param('to'), param('cityId', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, delivered: { type: 'integer' }, failed: { type: 'integer' } } } } }), 401: errorEnvelope }),
        },
    },
    '/api/admin/analytics/by-city': {
        get: {
            tags: ['Admin · Reports'], summary: 'Order counts grouped by city', security: bearerAuth,
            parameters: [param('days', { type: 'integer', description: 'default 30' }), param('from'), param('to')],
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: { type: 'object', properties: { city_id: { type: 'integer' }, name_tm: { type: 'string' }, name_ru: { type: 'string' }, order_count: { type: 'integer' } } } } }), 401: errorEnvelope }),
        },
    },
    '/api/admin/analytics/cancellations': {
        get: {
            tags: ['Admin · Reports'], summary: 'Cancellation split (by user vs by driver)', security: bearerAuth,
            parameters: [param('days', { type: 'integer', description: 'default 30' }), param('from'), param('to'), param('cityId', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object', properties: { cancelled_by_user: { type: 'integer' }, cancelled_by_driver: { type: 'integer' } } } }), 401: errorEnvelope }),
        },
    },
    '/api/admin/analytics/peak-hours': {
        get: {
            tags: ['Admin · Reports'], summary: 'Order counts by hour of day (0-23, zero-filled)', security: bearerAuth,
            parameters: [param('days', { type: 'integer', description: 'default 30' }), param('from'), param('to'), param('cityId', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: { type: 'object', properties: { hour: { type: 'integer' }, order_count: { type: 'integer' } } } } }), 401: errorEnvelope }),
        },
    },

    // ── Admin: Payments ───────────────────────────────────────────────────────
    '/api/admin/payments': {
        get: {
            tags: ['Admin · Payments'], summary: 'List payments', security: bearerAuth,
            parameters: [
                param('status', { description: 'paid | refunded' }), param('paymentType'), param('driverId', { type: 'integer' }),
                param('search'), param('from'), param('to'), param('limit', { type: 'integer' }), param('page', { type: 'integer' }),
            ],
            responses: responses({ 200: paginated(paymentSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/payments/summary': {
        get: {
            tags: ['Admin · Payments'], summary: 'Revenue/refund totals by payment type', security: bearerAuth,
            parameters: [param('from'), param('to')],
            responses: responses({
                200: okEnvelope({
                    result: {
                        type: 'object', properties: {
                            paid_count: { type: 'integer' }, total_revenue: { type: 'number' },
                            refunded_count: { type: 'integer' }, total_refunded: { type: 'number' },
                            cash_revenue: { type: 'number' }, card_revenue: { type: 'number' }, balance_revenue: { type: 'number' },
                        },
                    },
                }), 401: errorEnvelope,
            }),
        },
    },
    '/api/admin/payments/{id}/refund': {
        post: {
            tags: ['Admin · Payments'], summary: 'Refund a payment', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { note: { type: 'string', nullable: true } } }),
            responses: responses({ 200: okEnvelope({ result: paymentSchema }), 401: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },

    // ── Admin: Settings ───────────────────────────────────────────────────────
    '/api/admin/settings': {
        get: {
            tags: ['Admin · Settings'], summary: 'Get company settings (singleton)', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ result: adminSettingsSchema }), 401: errorEnvelope }),
        },
        put: {
            tags: ['Admin · Settings'], summary: 'Update company settings (admin role only)', security: bearerAuth,
            requestBody: jsonBody({
                type: 'object', required: ['company_name', 'support_phone', 'timezone', 'default_lang', 'default_currency', 'distance_unit', 'date_format'],
                properties: {
                    company_name: { type: 'string' }, support_phone: { type: 'string' }, timezone: { type: 'string' },
                    default_lang: { type: 'string', enum: ['tk', 'ru'] }, default_currency: { type: 'string', enum: ['TMT', 'USD'] },
                    distance_unit: { type: 'string', enum: ['km', 'mi'] }, date_format: { type: 'string', enum: ['DD.MM.YYYY', 'YYYY-MM-DD'] },
                },
            }),
            responses: responses({ 200: okEnvelope({ result: adminSettingsSchema }), 400: errorEnvelope, 401: errorEnvelope, 403: errorEnvelope }),
        },
    },
    '/api/admin/settings/notifications': {
        get: {
            tags: ['Admin · Settings'], summary: 'Get the current admin\'s notification preferences', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ result: notifPrefsSchema }), 401: errorEnvelope }),
        },
        put: {
            tags: ['Admin · Settings'], summary: 'Update the current admin\'s notification preferences', security: bearerAuth,
            requestBody: jsonBody({
                type: 'object', required: ['rows', 'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'],
                properties: {
                    rows: { type: 'array', items: notifPrefRowSchema },
                    quiet_hours_enabled: { type: 'boolean' },
                    quiet_hours_start: { type: 'string', example: '22:00' },
                    quiet_hours_end: { type: 'string', example: '07:00' },
                },
            }),
            responses: responses({ 200: okEnvelope({ result: notifPrefsSchema }), 400: errorEnvelope, 401: errorEnvelope }),
        },
    },

    // ── Admin: Transactions ──────────────────────────────────────────────────
    '/api/admin/transactions': {
        get: {
            tags: ['Admin · Transactions'], summary: 'Balance ledger', security: bearerAuth,
            parameters: [param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated({ type: 'object' }), 401: errorEnvelope }),
        },
    },

    // ── Admin: Support chat ───────────────────────────────────────────────────
    '/api/admin/support': {
        get: {
            tags: ['Admin · Support'], summary: 'List support threads (one row per user, with last message + unread count)', security: bearerAuth,
            parameters: [param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(supportThreadSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/support/{userId}/messages': {
        get: {
            tags: ['Admin · Support'], summary: "Get a user's support thread (marks the user's messages as read)", security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: okEnvelope({ result: { type: 'array', items: supportMessageSchema } }), 401: errorEnvelope }),
        },
        post: {
            tags: ['Admin · Support'], summary: 'Reply in a support thread as the authenticated operator', security: bearerAuth,
            parameters: [param('userId', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { message: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: supportMessageSchema }), 401: errorEnvelope }),
        },
    },

    // ── Admin: SOS ────────────────────────────────────────────────────────────
    '/api/admin/sos': {
        get: {
            tags: ['Admin · SOS'], summary: 'List SOS alerts', security: bearerAuth,
            parameters: [param('status', { description: 'open | acknowledged | resolved' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(sosAlertSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/sos/{id}/status': {
        put: {
            tags: ['Admin · SOS'], summary: 'Update an SOS alert status', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] } } }),
            responses: responses({ 200: okEnvelope({ result: sosAlertSchema }), 400: errorEnvelope, 401: errorEnvelope, 404: errorEnvelope }),
        },
    },

    // ── Admin: Balance requests ────────────────────────────────────────────────
    '/api/admin/balance-requests': {
        get: {
            tags: ['Admin · Balance Requests'], summary: 'List balance top-up requests (with requesting user info)', security: bearerAuth,
            parameters: [param('status', { description: 'pending | confirmed | rejected' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(balanceRequestSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/balance-requests/{id}': {
        get: {
            tags: ['Admin · Balance Requests'], summary: 'Get a balance request with its chat thread', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({
                200: okEnvelope({ result: { allOf: [balanceRequestSchema, { type: 'object', properties: { messages: { type: 'array', items: balanceRequestMessageSchema } } }] } }),
                401: errorEnvelope, 404: errorEnvelope,
            }),
        },
    },
    '/api/admin/balance-requests/{id}/confirm': {
        put: {
            tags: ['Admin · Balance Requests'], summary: 'Confirm a request — credits the amount to the user balance', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: balanceRequestSchema }), 400: errorEnvelope, 401: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },
    '/api/admin/balance-requests/{id}/reject': {
        put: {
            tags: ['Admin · Balance Requests'], summary: 'Reject a request with an optional reason', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { reason: { type: 'string', nullable: true } } }),
            responses: responses({ 200: okEnvelope({ result: balanceRequestSchema }), 401: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },
    '/api/admin/balance-requests/{id}/messages': {
        post: {
            tags: ['Admin · Balance Requests'], summary: 'Reply in a balance request chat as the authenticated operator', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { message: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true } } }),
            responses: responses({ 201: okEnvelope({ result: balanceRequestMessageSchema }), 401: errorEnvelope, 404: errorEnvelope }),
        },
    },

    // ── Admin: Driver applications ───────────────────────────────────────────
    '/api/admin/driver-applications': {
        get: {
            tags: ['Admin · Driver Applications'], summary: 'List applications', security: bearerAuth,
            parameters: [param('status', { description: 'pending | approved | rejected' }), param('limit', { type: 'integer' }), param('page', { type: 'integer' })],
            responses: responses({ 200: paginated(applicationSchema), 401: errorEnvelope }),
        },
    },
    '/api/admin/driver-applications/{id}': {
        get: {
            tags: ['Admin · Driver Applications'], summary: 'Get application by id', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: applicationSchema }), 401: errorEnvelope, 404: errorEnvelope }),
        },
    },
    '/api/admin/driver-applications/{id}/approve': {
        put: {
            tags: ['Admin · Driver Applications'], summary: 'Approve — creates a taxi record + sets user role to driver', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope({ result: { type: 'object', properties: { application: applicationSchema, taxi: { type: 'object' } } } }), 401: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },
    '/api/admin/driver-applications/{id}/reject': {
        put: {
            tags: ['Admin · Driver Applications'], summary: 'Reject with a reason', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } }),
            responses: responses({ 200: okEnvelope({ result: applicationSchema }), 400: errorEnvelope, 401: errorEnvelope, 404: errorEnvelope, 409: errorEnvelope }),
        },
    },

    // ── Admin: Pricing ────────────────────────────────────────────────────────
    '/api/admin/pricing': {
        get: {
            tags: ['Admin · Pricing'], summary: 'List pricing config for all cities', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: pricingSchema } }), 401: errorEnvelope }),
        },
    },
    '/api/admin/pricing/{cityId}': {
        put: {
            tags: ['Admin · Pricing'], summary: 'Update pricing config for a city (admin role only)', security: bearerAuth,
            parameters: [param('cityId', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', required: ['base_price', 'price_per_km', 'free_wait_min', 'wait_price_min'], properties: { base_price: { type: 'number' }, price_per_km: { type: 'number' }, free_wait_min: { type: 'number' }, wait_price_min: { type: 'number' } } }),
            responses: responses({ 200: okEnvelope({ result: pricingSchema }), 400: errorEnvelope, 401: errorEnvelope, 403: errorEnvelope }),
        },
    },

    // ── Admin: Team ───────────────────────────────────────────────────────────
    '/api/admin/team': {
        get: {
            tags: ['Admin · Team'], summary: 'List team members (admin role only)', security: bearerAuth,
            responses: responses({ 200: okEnvelope({ data: { type: 'array', items: teamMemberSchema } }), 401: errorEnvelope, 403: errorEnvelope }),
        },
        post: {
            tags: ['Admin · Team'], summary: 'Create a team member (admin role only)', security: bearerAuth,
            requestBody: jsonBody({ type: 'object', required: ['name', 'phone', 'password'], properties: { name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['admin', 'operator'] } } }),
            responses: responses({ 201: okEnvelope({ result: teamMemberSchema }), 400: errorEnvelope, 401: errorEnvelope, 403: errorEnvelope }),
        },
    },
    '/api/admin/team/{id}': {
        put: {
            tags: ['Admin · Team'], summary: 'Update a team member (admin role only)', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            requestBody: jsonBody({ type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['admin', 'operator'] }, is_active: { type: 'boolean' } } }),
            responses: responses({ 200: okEnvelope({ result: teamMemberSchema }), 400: errorEnvelope, 401: errorEnvelope, 403: errorEnvelope, 404: errorEnvelope }),
        },
        delete: {
            tags: ['Admin · Team'], summary: 'Remove a team member (admin role only)', security: bearerAuth,
            parameters: [param('id', { where: 'path', type: 'integer', required: true })],
            responses: responses({ 200: okEnvelope(), 401: errorEnvelope, 403: errorEnvelope, 404: errorEnvelope }),
        },
    },
};

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'Hayyrly Taxi API',
        version: '1.0.0',
        description:
            'Mobile-facing REST API (no auth on most endpoints — see server/CLAUDE.md) plus the ' +
            '/api/admin/* web-panel API (Bearer JWT with a "typ":"admin" claim, obtained via /api/admin/auth/login).',
    },
    servers: [{ url: '/', description: 'Current host' }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
    },
    tags: [
        { name: 'Users' }, { name: 'Auth' }, { name: 'Cities' }, { name: 'Addresses' },
        { name: 'Cars' }, { name: 'Services' }, { name: 'Taksi' }, { name: 'Balance' },
        { name: 'Orders' }, { name: 'Map' }, { name: 'SOS' }, { name: 'Balance Requests' },
        { name: 'Support' }, { name: 'Misc' }, { name: 'Public' },
        { name: 'Admin · Auth' }, { name: 'Admin · Drivers' }, { name: 'Admin · Clients' },
        { name: 'Admin · Cities' }, { name: 'Admin · Orders' },
        { name: 'Admin · Reports' }, { name: 'Admin · Transactions' }, { name: 'Admin · Payments' },
        { name: 'Admin · Driver Applications' }, { name: 'Admin · Pricing' },
        { name: 'Admin · Team' }, { name: 'Admin · Settings' },
        { name: 'Admin · Support' }, { name: 'Admin · SOS' }, { name: 'Admin · Balance Requests' },
    ],
    paths,
};
