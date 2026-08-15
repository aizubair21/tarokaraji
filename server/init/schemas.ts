// server/init/schemas.ts
import CRUDManagerService from '../services/crudManager.service'

export function registerSchemas() {
  // Users schema
  CRUDManagerService.registerSchema({
    name: 'Users',
    columns: [
      'name_bangla', 'name_english', 'father_name', 'mother_name',
      'NID', 'educational_qualification', 'occupation', 'reference','reference_relation','reference_phone', 'phone_number', 
      'email', 'permanent_address', 'present_address', 'joined_date', 'user_id', 'role', 'status'
    ],
    primaryKey: 'user_id',
    timestamp: true
  })

  // Deposits schema
  CRUDManagerService.registerSchema({
    name: 'Transactions',
    columns: [
      'user_id', 'session', 'amount', 'type', 'month', 'method',
      'pay_to', 'send_from', 'transaction_id', 'date', 'remarks'
    ],
    timestamp: true
  })

  // Sessions schema
  CRUDManagerService.registerSchema({
    name: 'Sessions',
    columns: [
      'sessionName', 'monthlyDeposit', 'yearlyDeposit', 'totalDeposit', 'createdAt', 'details'
    ],
    timestamp: true
  })

  console.log('✅ All schemas registered')
}