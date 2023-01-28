import * as ff from '@google-cloud/functions-framework'

ff.http('ArchiveFanfic', (req: ff.Request, res: ff.Response) => {
    res.send('ok')
})