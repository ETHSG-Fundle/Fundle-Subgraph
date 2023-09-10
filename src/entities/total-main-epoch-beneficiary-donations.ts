// Schema:
import { BigInt } from '@graphprotocol/graph-ts';
import { TotalMainEpochBeneficiaryDonations } from '../../generated/schema';

// Constants/Helper:
import { setSyncingIndex } from '../utils/helper';
import { ZERO_BI } from '../utils/constants';

export function getTotalMainEpochBeneficiaryDonations(
  epochIndex: BigInt,
  beneficiary: string
): TotalMainEpochBeneficiaryDonations {
  let entityId = `${epochIndex}-${beneficiary}`;
  let totalMainEpochMainBeneficiaryDonation =
    TotalMainEpochBeneficiaryDonations.load(entityId);

  if (!totalMainEpochMainBeneficiaryDonation) {
    totalMainEpochMainBeneficiaryDonation = new TotalMainEpochBeneficiaryDonations(
      entityId
    );
    totalMainEpochMainBeneficiaryDonation.epoch = epochIndex;
    totalMainEpochMainBeneficiaryDonation.beneficiary = beneficiary;
    totalMainEpochMainBeneficiaryDonation.amount = ZERO_BI;
    setSyncingIndex(
      'totalmainepochmainbeneficiarydonations',
      totalMainEpochMainBeneficiaryDonation
    );

    totalMainEpochMainBeneficiaryDonation.save();
  }

  return totalMainEpochMainBeneficiaryDonation;
}
