// server/services/crudManager.service.ts
import { google } from 'googleapis'

export interface SheetSchema {
  name: string
  columns: string[]
  primaryKey?: string
  timestamp?: boolean
}

class CRUDManagerService {
  private auth: any
  private spreadsheetId: string
  private sheets: any
  private schemas: Map<string, SheetSchema>

  constructor() {
    this.spreadsheetId = useRuntimeConfig().spreadsheetId;
    this.schemas = new Map()
  }

  private async init() {
    if (!this.auth) {

      const credentials = JSON.parse(process.env.GCC)
      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })
      const authClient = await this.auth.getClient()
      this.sheets = google.sheets({ version: 'v4', auth: authClient as any })
    }
  }

  // Register a sheet schema
  registerSchema(schema: SheetSchema) {
    this.schemas.set(schema.name.toLowerCase(), schema)
  }

  // Get sheet ID by name
  private async getSheetId(sheetName: string): Promise<number> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      includeGridData: false
    })
    
    const sheet = spreadsheet.data.sheets?.find(
      (s: any) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
    )
    
    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error(`Sheet "${sheetName}" not found`)
    }
    
    return sheet.properties.sheetId
  }

  // Get all records from a sheet
  async getAll(sheetName: string): Promise<any[]> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    const range = `${schema.name}!A:${String.fromCharCode(65 + schema.columns.length - 1)}`
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range
    })

    const rows = response.data.values || []
    if (rows.length <= 1) return []
    // return rows;
  
    // Convert to objects
    const records = rows.slice(1).map((row: any[], index: number) => {
      const record: any = { id: index }
      schema.columns.forEach((col, idx) => {
        record[col] = row[idx] || ''
      })
      return record
    })
    //console.log(records);
    return records
  }

  // Get single record by ID
  async getById(sheetName: string, id: number): Promise<any> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    const rowNumber = id + 2 // +2 for header and 0-index
    const range = `${schema.name}!A${rowNumber}:${String.fromCharCode(65 + schema.columns.length - 1)}${rowNumber}`
    
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range
    })

    const row = response.data.values?.[0] || []
    const record: any = { id }
    schema.columns.forEach((col, idx) => {
      record[col] = row[idx] || ''
    })

    return record
  }

  // Create new record
  async create(sheetName: string, data: Record<string, any>): Promise<any> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    // Get current data to find next row
    const currentData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${schema.name}!A:${String.fromCharCode(65 + schema.columns.length - 1)}`
    })

    const nextRow = (currentData.data.values?.length || 1) + 1

    // Prepare row data
    const rowData = schema.columns.map(column => {
      let value = data[column]
      if (value === undefined || value === null) return ''
      
      // Handle special cases
      if (column === 'created_at' || column === 'updated_at') {
        return new Date().toISOString()
      }
      
      return value.toString()
    })

    // Append to sheet
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${schema.name}!A${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] }
    })

    return { 
      success: true, 
      id: nextRow - 2,
      message: `${schema.name} created successfully`,
      data: { id: nextRow - 2, ...data }
    }
  }

  // Update record
  async update(sheetName: string, id: number, data: Record<string, any>): Promise<any> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    const rowNumber = id + 2
    
    // Get existing row first
    const existing = await this.getById(sheetName, id)
    
    // Merge existing with new data
    const merged = { ...existing, ...data }
    if (schema.timestamp) {
      merged.updated_at = new Date().toISOString()
    }
    
    // Prepare row data
    const rowData = schema.columns.map(column => {
      let value = merged[column]
      return value !== undefined && value !== null ? value.toString() : ''
    })

    // Update the row
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${schema.name}!A${rowNumber}:${String.fromCharCode(65 + schema.columns.length - 1)}${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] }
    })

    return { 
      success: true, 
      message: `${schema.name} updated successfully`,
      data: { id, ...merged }
    }
  }

  // Delete entire row
  async delete(sheetName: string, id: number): Promise<any> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    const rowNumber = id + 2
    const sheetId = await this.getSheetId(schema.name)

    // Delete the entire row
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber
            }
          }
        }]
      }
    })

    return { 
      success: true, 
      message: `${schema.name} deleted successfully`,
      deletedId: id
    }
  }

  // Search/Filter records
  async search(sheetName: string, filters: Record<string, any>): Promise<any[]> {
    const allRecords = await this.getAll(sheetName)
    
    return allRecords.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        const recordValue = record[key]?.toString().toLowerCase() || ''
        const searchValue = value.toString().toLowerCase()
        return recordValue.includes(searchValue)
      })
    })
  }

  // Bulk create multiple records
  async bulkCreate(sheetName: string, records: Record<string, any>[]): Promise<any> {
    await this.init()
    const schema = this.schemas.get(sheetName.toLowerCase())
    if (!schema) throw new Error(`Schema not found for: ${sheetName}`)

    const currentData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${schema.name}!A:${String.fromCharCode(65 + schema.columns.length - 1)}`
    })

    let startRow = (currentData.data.values?.length || 1) + 1
    
    // Prepare all rows
    const rowsData = records.map(record => {
      return schema.columns.map(column => {
        let value = record[column]
        if (value === undefined || value === null) return ''
        if (column === 'created_at') return new Date().toISOString()
        return value.toString()
      })
    })

    // Append all rows
    for (const rowData of rowsData) {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${schema.name}!A${startRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] }
      })
      startRow++
    }

    return { 
      success: true, 
      message: `${records.length} records created successfully`,
      count: records.length
    }
  }

  // Get sheet statistics
  async getStats(sheetName: string): Promise<any> {
    const records = await this.getAll(sheetName)
    return {
      totalRecords: records.length,
      sheetName,
      lastUpdated: new Date().toISOString()
    }
  }
}

export default new CRUDManagerService()