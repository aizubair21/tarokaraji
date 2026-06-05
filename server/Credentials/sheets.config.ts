// server/config/sheets.config.ts
export const sheetConfigs = {
  users: {
    sheetName: 'Users',
    range: 'A:S',
    columns: [
      'user_id',
      'name_bangla',
      'name_english',
      'father_name',
      'mother_name',
      'date_of_birth',
      'educational_qualification',
      'occupation',
      'phone_number',
      'email',
      'present_address',
      'permanent_address',
      'reference',
      'joined_date',
      'user_id_display',
      'role',
      'status'
    ]
  },
  
  deposits: {
    sheetName: 'Deposits',
    range: 'A:K',
    columns: [
      'user_id',
      'session',
      'amount',
      'type',
      'month',
      'method',
      'pay_to',
      'send_from',
      'transaction_id',
      'date',
      'remarks'
    ]
  },
  
  sessions: {
    sheetName: 'Sessions',
    range: 'A:E',
    columns: [
      'sessionName',
      'monthlyDeposit',
      'yearlyDeposit',
      'totalDeposit',
      'createdAt'
    ]
  }
}

export type SheetType = keyof typeof sheetConfigs