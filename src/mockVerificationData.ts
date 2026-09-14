import { VerificationStatus } from "./types";

// Mock MTN-approved recipient numbers for demonstration
// In a real application, this would come from an API
const MOCK_MTN_APPROVED_NUMBERS = new Set([
  "0241234567",
  "0242345678",
  "0243456789",
  "0244567890",
  "0245678901",
  "0246789012",
  "0247890123",
  "0248901234",
  "0249012345",
  "0240123456",
  "0201234567",
  "0202345678",
  "0203456789",
  "0204567890",
  "0205678901",
  "0206789012",
  "0207890123",
  "0208901234",
  "0209012345",
  "0200123456",
  "0541234567",
  "0542345678",
  "0543456789",
  "0544567890",
  "0545678901",
  "0546789012",
  "0547890123",
  "0548901234",
  "0549012345",
  "0540123456",
  "0551234567",
  "0552345678",
  "0553456789",
  "0554567890",
  "0555678901",
  "0556789012",
  "0557890123",
  "0558901234",
  "0559012345",
  "0550123456",
  "0591234567",
  "0592345678",
  "0593456789",
  "0594567890",
  "0595678901",
  "0596789012",
  "0597890123",
  "0598901234",
  "0599012345",
  "0590123456",
]);

// Mock DataHub-eligible recipient numbers
const MOCK_DATAHUB_ELIGIBLE_NUMBERS = new Set([
  "0241234567",
  "0242345678",
  "0243456789",
  "0201234567",
  "0202345678",
  "0541234567",
  "0542345678",
  "0551234567",
  "0552345678",
  "0591234567",
]);

/**
 * Normalize phone number to standard format (remove spaces, dashes, etc.)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "").trim();
}

/**
 * Validate Ghana phone number format
 * Ghana numbers start with 0 followed by 2 or 3 digits (network prefix), then 7 digits
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  const ghanaPhoneRegex = /^0[2345]\d{8}$/;
  return ghanaPhoneRegex.test(normalized);
}

/**
 * Check if a number is in the mock MTN approved list
 * This is a deterministic mock - same number always returns same result
 */
export function isMockMtnApproved(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return MOCK_MTN_APPROVED_NUMBERS.has(normalized);
}

/**
 * Check if a number is in the mock DataHub eligible list
 */
export function isMockDataHubEligible(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return MOCK_DATAHUB_ELIGIBLE_NUMBERS.has(normalized);
}

/**
 * Simulate verification of a single phone number
 * Returns mock verification result
 */
export function verifyPhoneNumber(phone: string): {
  status: VerificationStatus;
  isEligible: boolean;
  explanation: string;
} {
  const normalized = normalizePhoneNumber(phone);
  
  if (!validatePhoneNumber(phone)) {
    return {
      status: "unverified",
      isEligible: false,
      explanation: "Invalid phone number format",
    };
  }

  const isApproved = isMockMtnApproved(normalized);
  
  if (isApproved) {
    return {
      status: "verified",
      isEligible: true,
      explanation: "Number is eligible to receive MTN bundles",
    };
  } else {
    return {
      status: "unverified",
      isEligible: false,
      explanation: "Number must be verified before purchasing MTN bundles",
    };
  }
}

/**
 * Simulate bulk verification of multiple phone numbers
 * Returns array of verification results
 */
export function verifyPhoneNumbers(phoneNumbers: string[]): {
  results: Array<{
    phoneNumber: string;
    status: VerificationStatus;
    isEligible: boolean;
    explanation?: string;
  }>;
  summary: {
    totalNumbers: number;
    verified: number;
    unverified: number;
  };
} {
  const results = phoneNumbers.map((phone) => {
    const verification = verifyPhoneNumber(phone);
    return {
      phoneNumber: normalizePhoneNumber(phone),
      status: verification.status,
      isEligible: verification.isEligible,
      explanation: verification.explanation,
    };
  });

  const verified = results.filter((r) => r.status === "verified").length;
  const unverified = results.filter((r) => r.status === "unverified").length;

  return {
    results,
    summary: {
      totalNumbers: results.length,
      verified,
      unverified,
    },
  };
}
