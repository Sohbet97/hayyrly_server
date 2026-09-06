const DriverService = require('../services/driverService');
const BalanceModel = require('../../../models/User/balanceModel');
const Validator = require('../../../utils/validator');
const { driverCreateSchema, driverUpdateSchema } = require('../validators/driver.schema');
const ApiError = require('../../../exceptions/api-error');

// FormData can't hold null, so the form sends '' for "no value" — converting
// that to null (rather than leaving '') lets yup's required() reject it the
// same way it would reject an actually-missing field.
const EMPTY_TO_NULL_FIELDS = ['birthday', 'cityId', 'autoNumber', 'markaId', 'modelId', 'autoYear', 'park'];
const NUMERIC_FIELDS = ['cityId', 'markaId', 'modelId', 'autoYear'];

// The create/update endpoints accept multipart form-data (so avatar/carImage
// files can ride in the same request as the text fields). FormData can only
// carry strings, so every numeric field arrives as a string, and `park` (a
// boolean column — "belongs to a taxi park/fleet", not free text) arrives as
// the string 'true'/'false' — normalize all of that before validating against
// the yup schema.
function normalizeDriverBody(body) {
    const out = { ...body };
    for (const field of EMPTY_TO_NULL_FIELDS) {
        if (out[field] === '') out[field] = null;
    }
    for (const field of NUMERIC_FIELDS) {
        if (out[field] !== null && out[field] !== undefined) out[field] = parseInt(out[field], 10);
    }
    if (out.park !== null && out.park !== undefined) out.park = out.park === 'true' || out.park === true;
    return out;
}

function mediaFromFiles(req) {
    const media = {};
    if (req.files?.avatar?.[0]) media.avatar = req.files.avatar[0].savedPath;
    if (req.files?.carImage?.[0]) media.autoImage = req.files.carImage[0].savedPath;
    return media;
}

class DriverController {
    static async list(req, res, next) {
        try {
            const { cityId, isActive, limit, page } = req.query;
            const result = await DriverService.list({
                cityId: cityId ? parseInt(cityId, 10) : undefined,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
                limit, page,
            });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) throw ApiError.BadRequest('Invalid userId');

            const driver = await DriverService.getById(userId);
            return res.status(200).json({ status: true, driver });
        } catch (e) { next(e); }
    }

    static async getOrders(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) throw ApiError.BadRequest('Invalid userId');

            const { limit, page } = req.query;
            const result = await DriverService.getOrders(userId, { limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const body = normalizeDriverBody(req.body);
            const { isError, errors } = await Validator.validate(driverCreateSchema, body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const created = await DriverService.create({ ...body, ...mediaFromFiles(req) });
            const driver = await DriverService.getById(created.user_id);
            return res.status(201).json({ status: true, driver });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) throw ApiError.BadRequest('Invalid userId');

            const body = normalizeDriverBody(req.body);
            const { isError, errors } = await Validator.validate(driverUpdateSchema, body);
            if (isError) throw ApiError.BadRequest(null, errors);

            await DriverService.update(userId, { ...body, ...mediaFromFiles(req) });
            const driver = await DriverService.getById(userId);
            return res.status(200).json({ status: true, driver });
        } catch (e) { next(e); }
    }

    static async setActive(req, res, next) {
        try {
            const userId = req.params.userId;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                throw ApiError.BadRequest('isActive (boolean) is required');
            }

            const result = await DriverService.setActive(userId, isActive);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async adjustBalance(req, res, next) {
        try {
            const userId = req.params.userId;
            const { amount, direction, note } = req.body;

            if (!amount || !['add', 'remove'].includes(direction)) {
                throw ApiError.BadRequest('amount and direction (add|remove) are required');
            }

            const data = {
                userId,
                price: amount,
                sendedUserId: req.admin.id,
                sendedName: req.admin.name,
                confirmedName: note || req.admin.name,
            };

            const result = direction === 'add'
                ? await BalanceModel.addBalanceInUser(data)
                : await BalanceModel.removeBalanceInUSer(data);

            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = DriverController;
