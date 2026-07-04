const TeamService = require('../services/teamService');
const Validator = require('../../../utils/validator');
const { teamCreateSchema, teamUpdateSchema } = require('../validators/team.schema');
const ApiError = require('../../../exceptions/api-error');

class TeamController {
    static async list(req, res, next) {
        try {
            const data = await TeamService.list();
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(teamCreateSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await TeamService.create(req.body);
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(teamUpdateSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await TeamService.update(req.params.id, req.body);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async remove(req, res, next) {
        try {
            await TeamService.remove(req.params.id);
            return res.status(200).json({ status: true });
        } catch (e) { next(e); }
    }
}

module.exports = TeamController;
