// Events from ABI:
import { Donation as DonationEvent } from '../../generated/BeneficiaryDonationManager/BeneficiaryDonationManager';

// Schemas:
import { getUser } from '../entities/user';

// Constants/Helpers:
import { setSyncingIndex } from '../utils/helper';
import { MainDonations } from '../../generated/schema';
import { getBeneficiary } from '../entities/beneficiary';
import { getTotalMainEpochBeneficiaryDonations } from '../entities/total-main-epoch-beneficiary-donations';

export function handleBeneficiaryDonation(event: DonationEvent) {
  let txHash = event.transaction.hash;
  let epochIndex = event.params.epoch;
  let donatedAmount = event.params.amount;
  let user = getUser(event.params.donor.toHexString());
  let beneficiary = getBeneficiary(event.params.beneficiary.toHexString());

  let mainDonation = new MainDonations(txHash.toHexString());
  mainDonation.epoch = epochIndex;
  mainDonation.donor = user.id;
  mainDonation.beneficiary = beneficiary.id;
  mainDonation.amount = donatedAmount;
  mainDonation.timestamp = event.block.timestamp;
  setSyncingIndex('maindonations', mainDonation);

  mainDonation.save();

  let totalMainEpochBeneficiaryDonation = getTotalMainEpochBeneficiaryDonations(
    epochIndex,
    beneficiary.id
  );

  totalMainEpochBeneficiaryDonation.amount =
    totalMainEpochBeneficiaryDonation.amount.plus(donatedAmount);

  totalMainEpochBeneficiaryDonation.save();
}
