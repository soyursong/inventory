// CRM API 클라이언트 - 외부 CRM 시스템과 연동

export interface CRMConsumptionItem {
  crmReferenceId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  consumedAt: string;
  patientId?: string;
  procedureType?: string;
}

export interface CRMSyncResult {
  success: boolean;
  data: CRMConsumptionItem[];
  syncedAt: string;
  error?: string;
}

class CRMClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.CRM_API_URL || "http://localhost:3000/api/mock/crm";
    this.apiKey = process.env.CRM_API_KEY || "";
  }

  async fetchConsumption(
    fromDate: string,
    toDate: string
  ): Promise<CRMSyncResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/consumption?from=${fromDate}&to=${toDate}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CRM API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.items || [],
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        syncedAt: new Date().toISOString(),
        error: String(error),
      };
    }
  }
}

export const crmClient = new CRMClient();
