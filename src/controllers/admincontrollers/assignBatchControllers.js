import Enrollment from '../../models/Enrollment.js';
// GET /api/enrollment/unassigned
export const getUnassignedUsers = async (req, res) => {
    try {
        const unassigned = await Enrollment.find({
            $or: [{ batchId: { $exists: false } }, { batchId: null }],
            'user.role': { $ne: 'admin' }
        }).select('user');
        console.log('Unassigned users:', unassigned);
        const sanitizedUsers = unassigned.map(({ user }) => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        res.json({ users: sanitizedUsers });
    } catch (error) {
        console.error('Error fetching unassigned users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// POST /api/enrollment/assign
export const assignUserToBatch = async (req, res) => {
    const { userId, batchId } = req.body;

    try {
        const enrollment = await Enrollment.findOne({ 'user.id': userId });

        if (!enrollment) {
            return res.status(404).json({ error: 'User not found' });
        }

        enrollment.batchId = batchId;
        await enrollment.save();

        res.json({ success: true, userId, batchId });
    } catch (error) {
        console.error('Error assigning batch:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};