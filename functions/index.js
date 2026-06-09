const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

exports.processEmailQueue = onValueCreated(
    { 
        ref: "/users/{userId}/queue/{queueId}", 
        region: "europe-west1" 
    }, 
    async (event) => {
        const queueData = event.data.val();
        const { userId, queueId } = event.params;
        const realCampaignId = queueData.campaignId; 

        console.log(`Processing campaign for user: ${userId}, sending to: ${queueData.recipientEmail}`);

        const BREVO_KEY = "COPY_YOUR_BREVO_KEY_HERE"; // <-- REPLACE THIS WITH YOUR ACTUAL BREVO KEY

        try {
            const userRecord = await admin.auth().getUser(userId);
            const actualUserEmail = userRecord.email;

            // 1. Base Email Payload
            const emailPayload = {
                sender: { "name": "Swoosh Campaigns", "email": "kuria5614@gmail.com" },
                replyTo: { "email": actualUserEmail },
                to: [{ "email": queueData.recipientEmail }], 
                subject: queueData.name,
                htmlContent: queueData.content
            };

            // 2. THE ATTACHMENT FIX: If a PDF URL exists, tell Brevo to attach it!
            if (queueData.pdfUrl) {
                emailPayload.attachment = [
                    { 
                        url: queueData.pdfUrl, 
                        name: `${queueData.name.replace(/\s+/g, '_')}_Document.pdf` 
                    }
                ];
                console.log("PDF Attachment included in payload.");
            }

            // 3. Send to Brevo
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": BREVO_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify(emailPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Brevo API Error: ${errorText}`);
            }

            console.log(`Email sent successfully to ${queueData.recipientEmail}`);

            await admin.database().ref(`/users/${userId}/queue/${queueId}`).remove();

            return admin.database().ref(`/users/${userId}/campaigns/${realCampaignId}`)
                .update({ status: "Completed" });

        } catch (error) {
            console.error("Failed to process queue:", error);
            return null;
        }
    }
);