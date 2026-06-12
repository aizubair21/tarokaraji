// server/config/sheets.config.ts
export const sheetConfigs = {
  users: {
    sheetName: 'Users',
    range: 'A:S',
    columns: [
      'name_bangla',
      'name_english',
      'father_name',
      'mother_name',
      'nid',
      'educational_qualification',
      'occupation',
      'reference',
      'reference_relation',
      'reference_phone',
      'phone_number',
      'email',
      'permanent_address',
      'present_address',
      'joined_date',
      'user_id_display',
      'role',
      'status'
    ]
  },
  
  deposits: {
    sheetName: 'Deposits',
    range: 'A:L',
    columns: [
      'user_id',
      'session',
      'amount',
      'type',
      'month',
      'method',
      'pay_to',
      'send_from',
      'send_to',
      'transaction_id',
      'date',
      'remarks'
    ]
  },
  
  sessions: {
    sheetName: 'Sessions',
    range: 'A:F',
    columns: [
      'sessionName',
      'monthlyDeposit',
      'yearlyDeposit',
      'totalDeposit',
      'createdAt',
      'details'
    ]
  },

  Expendeture: {
    sheetName: 'Expendeture',
    range: 'A:Z',
    columns: [
      'name',
      'amount',
      'date',
      'details',
    ]
  },
  

  Projects: {
    sheetName: 'Projects',
    range: 'A:Z',
    columns: [
      'name',
      'amount',
      'start_date',
      'end_date',
      'term',
      'profitable',
      'profit_earn',
      'status',
      'loss',
      'benificent',
      'benificary',
      'benificary_phone',
      'benificary_address',

    ]
  }
}

export type SheetType = keyof typeof sheetConfigs