import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import jwt from 'jsonwebtoken';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Mooda Server!');
});

app.post(
  '/api/auth/login',
  async (req: Request, res: Response): Promise<void> => {
    const { kakaoId, email, userName } = req.body;

    if (!kakaoId) {
      res.status(400).json({ error: 'kakaoId is required' });
      return;
    }

    try {
      const userUpserted = await prisma.user.upsert({
        where: { kakaoId: kakaoId.toString() },
        update: { userName, email },
        create: {
          kakaoId: kakaoId.toString(),
          email,
          userName,
        },
      });

      const jwtSecret = process.env.JWT_SECRET;
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!jwtSecret || !refreshTokenSecret) {
        throw new Error(
          'JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables.'
        );
      }

      const accessTokenPayload = { userId: userUpserted.id };
      const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: '1h',
      });

      const refreshTokenPayload = { userId: userUpserted.id };
      const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecret, {
        expiresIn: '7d',
      });

      // Store the refresh token in the database
      await prisma.user.update({
        where: { id: userUpserted.id },
        data: { refreshToken },
      });

      res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
      console.error('Login/Register Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

app.post(
  '/api/auth/refresh',
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh Token is required' });
      return;
    }

    try {
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!refreshTokenSecret) {
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
      }

      const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });

      if (!user || user.refreshToken !== refreshToken) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const accessTokenPayload = { userId: user.id };
      const newAccessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: '1h',
      });

      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
      } else {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
