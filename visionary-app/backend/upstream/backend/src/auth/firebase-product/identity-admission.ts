import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

export function admitProductIdentity(identity: any, phoneEnabled: boolean) {
  const phone = identity.firebase?.sign_in_provider === 'phone';
  if (phone) {
    if (!phoneEnabled) throw new ServiceUnavailableException('Phone sign-in is temporarily unavailable. Use email or Google.');
    const number = identity.phone_number;
    const verifiedNumbers = identity.firebase?.identities?.phone;
    if (typeof number !== 'string' || !/^\+[1-9]\d{7,14}$/.test(number) || !Array.isArray(verifiedNumbers) || !verifiedNumbers.includes(number)) {
      throw new UnauthorizedException('Verify your phone number before continuing.');
    }
    return;
  }
  if (typeof identity.email !== 'string' || !identity.email || identity.email_verified !== true) throw new UnauthorizedException('Verify your email before continuing.');
}
