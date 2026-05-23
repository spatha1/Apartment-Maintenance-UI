export interface User {
  user_id: number
  username: string
  role: 'admin' | 'user'
  flat_no: string | null
}

export interface Month {
  month_id: number
  name: string
  is_locked: boolean
}

export interface ExpenseRow {
  id: number
  type: string
  amount: number
}

export interface ExpensesData {
  rows: ExpenseRow[]
  total: number
  per_flat: number
}

export interface WaterSource {
  id: number
  tankers_count: number
  tanker_price: number
  other_water_cost: number
  total_liters: number
  total_cost: number
  rate_per_liter: number
}

export interface WaterReading {
  id: number
  flat_no: string
  previous_reading: number
  current_reading: number
  liters: number
  amount: number
  image_url: string | null
}

export interface WaterReadingsData {
  readings: Record<string, WaterReading>
  previous: Record<string, number>
  flats: string[]
}

export interface SummaryRow {
  id: number
  flat_no: string
  common_amount: number
  water_amount: number
  total_amount: number
  carried_forward: number
  grand_total: number
  paid_amount: number
  status: 'Paid' | 'Partial' | 'Pending' | 'Pending Verification'
  paid_date: string | null
  payment_reference: string | null
  paid_by: string | null
}

export interface MonthStats {
  month: Month
  common_total: number
  common_per_flat: number
  water_source: WaterSource
  paid_count: number
  flat_count: number
  residential_count: number
}

export interface MyBillData {
  flat_no: string
  months: Month[]
  month: Month | null
  bill: SummaryRow | null
}

export interface FlatsData {
  all: string[]
  residential: string[]
  shops: string[]
  shop_charges: Record<string, number>
}

export interface Notice {
  id: number
  content: string
  created_at: string
  created_by: string
}

export interface PoolTransaction {
  id: number
  date: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  reference: string | null
  created_by: string | null
}

export interface PoolData {
  balance: number
  transactions: PoolTransaction[]
}
