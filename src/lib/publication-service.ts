import mongoose from 'mongoose';
import Hackathon from '@/models/Hackathon';
import Team from '@/models/Team';
import Submission from '@/models/Submission';

/**
 * Invalidates the published state of a hackathon if scores, evaluation statuses, or weights
 * change after official publication.
 * 
 * Ensures participants cannot see stale ranks or winner badges until a fresh calculation
 * is run and the organizer explicitly republishes the results.
 */
export async function invalidateHackathonPublication(
    hackathonId: string | mongoose.Types.ObjectId,
    reason: string,
    performer = 'SYSTEM'
): Promise<boolean> {
    try {
        const hackathon = await Hackathon.findById(hackathonId);
        if (!hackathon || !hackathon.isFinalResultsPublished) {
            return false;
        }

        const now = new Date();
        hackathon.isFinalResultsPublished = false;
        hackathon.finalResultsInvalidatedAt = now;
        hackathon.finalResultsInvalidationReason = reason;

        if (!hackathon.publicationHistory) {
            hackathon.publicationHistory = [];
        }

        hackathon.publicationHistory.push({
            action: reason.toLowerCase().includes('weight') ? 'INVALIDATED_WEIGHT_CHANGE' : 'INVALIDATED_SCORE_CHANGE',
            timestamp: now,
            performedBy: performer,
            reason
        });

        await hackathon.save();

        // Clear stale winner statuses and ranks so participants cannot see them
        await Team.updateMany(
            { hackathon: hackathonId },
            { $set: { isWinner: false, winnerPosition: undefined } }
        );

        await Submission.updateMany(
            { hackathon: hackathonId },
            { $set: { isWinner: false, winnerPosition: undefined } }
        );

        console.log(`[Publication Guard] Publication invalidated for hackathon ${hackathonId}. Reason: ${reason}`);
        return true;
    } catch (error) {
        console.error('[Publication Guard] Error invalidating hackathon publication:', error);
        return false;
    }
}
