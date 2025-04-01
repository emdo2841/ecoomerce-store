const paginate = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip =  limit * (page - 1);
    return { page, limit, skip };
}
module.exports = paginate;