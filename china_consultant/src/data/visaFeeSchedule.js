export const VISA_PROCESSING_SPEEDS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'express', label: 'Express' },
];

export const VISA_FEE_SCHEDULE_2024 = {
  Nepal: {
    'Mainland China': {
      Single: { normal: 5900, urgent: 10550, express: 13800 },
      Double: { normal: 5900, urgent: 10550, express: 13800 },
      'Half Year Multiple': { normal: 5900, urgent: 10550, express: 13800 },
      'One Year Multiple': { normal: 7900, urgent: 12550, express: 15800 },
    },
    'Group Visa': {
      Single: { normal: 4900, urgent: 8700, express: 11800 },
    },
  },
  'Other Countries': {
    'Mainland China': {
      Single: { normal: 9500, urgent: 14150, express: 17400 },
      Double: { normal: 11300, urgent: 15950, express: 19200 },
    },
    'Group Visa': {
      Single: { normal: 7800, urgent: 11600, express: 14700 },
    },
  },
  USA: {
    'Mainland China': {
      'Single / Double': { normal: 27000, urgent: 31650, express: 34900 },
    },
    'Group Visa': {
      Single: { normal: 20200, urgent: 24000, express: 27100 },
    },
  },
  Canada: {
    'Mainland China': {
      'Single / Double / Multiple': { normal: 15500, urgent: 20150, express: 23400 },
    },
    'Group Visa': {
      Single: { normal: 11000, urgent: 14800, express: 17900 },
    },
  },
  Israel: {
    'Mainland China': {
      'Single / Double / Multiple': { normal: 8500, urgent: 13150, express: 17400 },
    },
    'Group Visa': {
      Single: { normal: 7000, urgent: 10800, express: 13900 },
    },
  },
  Romania: {
    'Mainland China': {
      Single: { normal: 13700, urgent: 18350, express: 21600 },
      Double: { normal: 18200, urgent: 20850, express: 24100 },
      Multiple: { normal: 23400, urgent: 28050, express: 31300 },
    },
    'Group Visa': {
      Single: { normal: 11100, urgent: 14900, express: 18000 },
    },
  },
  'Albania / Micronesia & BIH': {
    'Mainland China': {
      'Single / Double': { normal: 5900, urgent: 10550, express: 14800 },
    },
    'Group Visa': {
      Single: { normal: 4900, urgent: 8900, express: 12000 },
    },
  },
  Serbia: {
    'Mainland China': {
      'Single / Double': { normal: 6350, urgent: 11000, express: 14250 },
    },
    'Group Visa': {
      Single: { normal: 5100, urgent: 8900, express: 12000 },
    },
  },
  Brazil: {
    'Mainland China': {
      'Single / Double / Multiple': { normal: 20800, urgent: 25450, express: 28700 },
    },
    'Group Visa': {
      Single: { normal: 15300, urgent: 19100, express: 22200 },
    },
  },
  Argentina: {
    'Mainland China': {
      Single: { normal: 9500, urgent: 14150, express: 17400 },
      Double: { normal: 11300, urgent: 15950, express: 19200 },
      Multiple: { normal: 23400, urgent: 28050, express: 31300 },
    },
    'Group Visa': {
      Single: { normal: 7800, urgent: 11600, express: 14700 },
    },
  },
  Panama: {
    'Mainland China': {
      'Single / Double / Multiple': { normal: 14100, urgent: 18750, express: 22000 },
    },
    'Group Visa': {
      Single: { normal: 9900, urgent: 13700, express: 16850 },
    },
  },
  Uruguay: {
    'Mainland China': {
      'Single / Double': { normal: 10300, urgent: 15000, express: 18250 },
    },
    'Group Visa': {
      NA: { normal: null, urgent: null, express: null },
    },
  },
};

export const VISA_FEE_NATIONALITIES = Object.keys(VISA_FEE_SCHEDULE_2024);

export function getFeeDestinations(nationality) {
  return Object.keys(VISA_FEE_SCHEDULE_2024[nationality] || {});
}

export function getFeeEntries(nationality, destination) {
  return Object.keys(VISA_FEE_SCHEDULE_2024[nationality]?.[destination] || {});
}

export function getVisaFee(nationality, destination, entry, speed) {
  const value = VISA_FEE_SCHEDULE_2024[nationality]?.[destination]?.[entry]?.[speed];
  return value ?? null;
}
