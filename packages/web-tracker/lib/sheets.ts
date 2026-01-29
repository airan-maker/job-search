import { google } from 'googleapis';

// Google Sheets 인증 설정
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// Sheets API 클라이언트
function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = '포지션';

// 포지션 타입 정의
export interface Position {
  id: string;
  company: string;
  title: string;
  url: string;
  status: '관심' | '지원예정' | '지원완료' | '서류통과' | '면접예정' | '면접완료' | '최종합격' | '불합격' | '포기';
  salary: string;
  location: string;
  notes: string;
  appliedDate: string;
  updatedAt: string;
}

// 모든 포지션 조회
export async function getPositions(): Promise<Position[]> {
  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:J`,
    });

    const rows = response.data.values || [];

    return rows.map((row, index) => ({
      id: String(index + 2), // 행 번호 (헤더가 1행이므로 2부터 시작)
      company: row[0] || '',
      title: row[1] || '',
      url: row[2] || '',
      status: row[3] || '관심',
      salary: row[4] || '',
      location: row[5] || '',
      notes: row[6] || '',
      appliedDate: row[7] || '',
      updatedAt: row[8] || '',
    }));
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
}

// 포지션 추가
export async function addPosition(position: Omit<Position, 'id' | 'updatedAt'>): Promise<void> {
  const sheets = getSheetsClient();
  const now = new Date().toISOString().split('T')[0];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          position.company,
          position.title,
          position.url,
          position.status,
          position.salary,
          position.location,
          position.notes,
          position.appliedDate,
          now,
        ]],
      },
    });
  } catch (error) {
    console.error('Error adding position:', error);
    throw error;
  }
}

// 포지션 수정
export async function updatePosition(id: string, position: Partial<Position>): Promise<void> {
  const sheets = getSheetsClient();
  const rowNumber = parseInt(id);
  const now = new Date().toISOString().split('T')[0];

  try {
    // 현재 행 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:J${rowNumber}`,
    });

    const currentRow = response.data.values?.[0] || [];

    // 업데이트할 데이터 병합
    const updatedRow = [
      position.company ?? currentRow[0] ?? '',
      position.title ?? currentRow[1] ?? '',
      position.url ?? currentRow[2] ?? '',
      position.status ?? currentRow[3] ?? '',
      position.salary ?? currentRow[4] ?? '',
      position.location ?? currentRow[5] ?? '',
      position.notes ?? currentRow[6] ?? '',
      position.appliedDate ?? currentRow[7] ?? '',
      now,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:I${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });
  } catch (error) {
    console.error('Error updating position:', error);
    throw error;
  }
}

// 포지션 삭제 (행 삭제 대신 데이터 클리어)
export async function deletePosition(id: string): Promise<void> {
  const sheets = getSheetsClient();
  const rowNumber = parseInt(id);

  try {
    // 행 삭제를 위해 batchUpdate 사용
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // 첫 번째 시트
              dimension: 'ROWS',
              startIndex: rowNumber - 1, // 0-based index
              endIndex: rowNumber,
            },
          },
        }],
      },
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    throw error;
  }
}

// 시트 초기화 (헤더 생성)
export async function initializeSheet(): Promise<void> {
  const sheets = getSheetsClient();

  try {
    // 헤더가 있는지 확인
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:I1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      // 헤더 추가
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:I1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['회사명', '포지션', 'URL', '상태', '연봉', '위치', '메모', '지원일', '수정일']],
        },
      });
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
    throw error;
  }
}

// 통계 조회
export async function getStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  recentApplications: number;
}> {
  const positions = await getPositions();

  const byStatus: Record<string, number> = {};
  positions.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  });

  // 최근 7일 내 지원
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentApplications = positions.filter(p => {
    if (!p.appliedDate) return false;
    return new Date(p.appliedDate) >= sevenDaysAgo;
  }).length;

  return {
    total: positions.length,
    byStatus,
    recentApplications,
  };
}
