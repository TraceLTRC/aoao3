import * as ff from '@google-cloud/functions-framework'
import * as admin from 'firebase-admin'

admin.initializeApp()
const firestore = admin.firestore()

ff.http('GetBucketStats', async (_, res) => {
    const doc = await firestore.collection("cache").doc('bucketStats').get()

    if (doc.exists) {
        const data = doc.data()
        if (data === undefined) {
            res.sendStatus(500).end()
            console.error("bucket stats cache doesn't exist?")
            return
        }
        res.send(data).end()
        return
    } else {
        res.sendStatus(500).end()
        console.error("bucket stats cache doesn't exist?")
        return
    }
})