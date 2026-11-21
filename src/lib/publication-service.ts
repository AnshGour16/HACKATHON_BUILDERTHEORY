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
        if (!hackathon) {
            return false;
        }

        const now = new Date();
        hackathon.isRankingDirty = true;
        hackathon.finalResultsInvalidatedAt = now;
        hackathon.finalResultsInvalidationReason = reason;

        const wasPublished = Boolean(hackathon.isFinalResultsPublished);
        if (wasPublished) {
            hackathon.isFinalResultsPublished = false;

            if (!hackathon.publicationHistory) {
                hackathon.publicationHistory = [];
            }

            hackathon.publicationHistory.push({
                action: reason.toLowerCase().includes('weight') ? 'INVALIDATED_WEIGHT_CHANGE' : 'INVALIDATED_SCORE_CHANGE',
                timestamp: now,
                performedBy: performer,
                reason
            });

            // Clear stale winner statuses and ranks so participants cannot see them
            await Team.updateMany(
                { hackathon: hackathonId },
                { $set: { isWinner: false, winnerPosition: undefined } }
            );

            await Submission.updateMany(
                { hackathon: hackathonId },
                { $set: { isWinner: false, winnerPosition: undefined } }
            );
        }

        await hackathon.save();

        console.log(`[Publication Guard] Rankings marked DIRTY (wasPublished=${wasPublished}) for hackathon ${hackathonId}. Reason: ${reason}`);
        return true;
    } catch (error) {
        console.error('[Publication Guard] Error invalidating hackathon publication:', error);
        return false;
    }
}
