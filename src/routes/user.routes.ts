import express from 'express';
import * as userController from '../controllers/user.controllers';

const userRouter = express.Router();

userRouter.route('/activate').get(userController.activateAccount);

export default userRouter;
