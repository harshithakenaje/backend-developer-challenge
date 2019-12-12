import { Router } from '../common-utils/express-utils';
import { reqErrorHandle as rEH } from '../common-utils/utils';
import { reqValidation } from '../middlewares/validationCatcher';

import { home } from './home';
import { upload, preReport, getReport } from './report';

const router = new Router();

router.get('/', rEH(home));

router.post('/report', upload.single('sample'), preReport, reqValidation, rEH(getReport));

export default router;
