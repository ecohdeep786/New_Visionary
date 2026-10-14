import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';
import { FirebaseProductController } from './firebase-product.controller';
import { FirebaseProductService } from './firebase-product.service';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), FirebaseAdminModule], controllers: [FirebaseProductController], providers: [FirebaseProductService] })
export class FirebaseProductModule {}
