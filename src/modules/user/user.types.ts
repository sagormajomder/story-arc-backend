import { Document } from 'mongoose';

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  profileImage: string;
}

export interface IUserDocuments extends IUser, Document {}

export interface IUserPlain extends IUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserResponse = Omit<IUserPlain, 'password'>;
