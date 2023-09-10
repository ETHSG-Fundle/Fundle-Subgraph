import { Beneficiary } from '../../generated/schema';
import { BENEFICIARY_DETAILS } from '../utils/constants';
import { setSyncingIndex } from '../utils/helper';

export function getBeneficiary(address: string): Beneficiary {
  let beneficiary = Beneficiary.load(address);

  if (!beneficiary) {
    beneficiary = new Beneficiary(address);
    beneficiary.name = getBeneficiaryName(address);
    beneficiary.address = address;

    setSyncingIndex('beneficiary', beneficiary);
    beneficiary.save();
  }
  return beneficiary;
}

export function getBeneficiaryName(address: string): string {
  return BENEFICIARY_DETAILS[address].name ?? 'UNKNOWN';
}
