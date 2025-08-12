/*
Module Name: Session Routes (Partner Integration)
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: Express routing for study session creation with partner invitation functionality and collaborative session management
*/
router.post('/sessions', auth, async (req, res) => {
  try {
    const { 
      subjectId, 
      sessionTitle, 
      startTime, 
      endTime, 
      sessionType,
      partnerIds = [] // New field for inviting partners
    } = req.body;

    // Create the session
    const session = await StudySession.create({
      userId: req.user.userId,
      subjectId,
      sessionTitle,
      startTime,
      endTime,
      sessionType
    });

    // If partners are invited, create partner session records
    if (sessionType !== 'solo' && partnerIds.length > 0) {
      const partnerInvites = partnerIds.map(partnerId => ({
        sessionId: session.sessionId,
        partnerId,
        status: 'invited'
      }));

      await PartnerSession.bulkCreate(partnerInvites);

      // Send notifications to invited partners
    }

    res.json({ session, invitedPartners: partnerIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});