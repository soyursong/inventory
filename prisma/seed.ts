import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hospital.com" },
    update: {},
    create: { email: "admin@hospital.com", name: "관리자", password: adminPassword, role: "ADMIN", phone: "010-1234-5678" },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@hospital.com" },
    update: {},
    create: { email: "manager@hospital.com", name: "김매니저", password: managerPassword, role: "MANAGER", phone: "010-2345-6789" },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@hospital.com" },
    update: {},
    create: { email: "staff@hospital.com", name: "박스태프", password: staffPassword, role: "STAFF", phone: "010-3456-7890" },
  });

  // Categories
  const catMedical = await prisma.category.create({ data: { name: "의료 소모품", description: "일회용 의료 소모품" } });
  const catPharm = await prisma.category.create({ data: { name: "의약품", description: "각종 의약품" } });
  const catEquip = await prisma.category.create({ data: { name: "의료 기기", description: "의료 장비 및 기기" } });
  const catGeneral = await prisma.category.create({ data: { name: "일반 소모품", description: "사무/일반 소모품" } });

  // Items
  const items = await Promise.all([
    prisma.item.create({ data: { name: "일회용 주사기 3ml", sku: "MED-001", categoryId: catMedical.id, unit: "EA", manufacturer: "(주)한국메디칼", safetyStock: 100 } }),
    prisma.item.create({ data: { name: "알코올 솜", sku: "MED-002", categoryId: catMedical.id, unit: "BOX", manufacturer: "(주)클린메디", safetyStock: 30 } }),
    prisma.item.create({ data: { name: "의료용 장갑 (M)", sku: "MED-003", categoryId: catMedical.id, unit: "BOX", manufacturer: "(주)메디글로브", safetyStock: 20 } }),
    prisma.item.create({ data: { name: "생리식염수 500ml", sku: "MED-004", categoryId: catPharm.id, unit: "BOTTLE", manufacturer: "JW중외제약", safetyStock: 50, expiryManaged: true } }),
    prisma.item.create({ data: { name: "거즈 (10x10cm)", sku: "MED-005", categoryId: catMedical.id, unit: "PACK", manufacturer: "(주)메디폼", safetyStock: 40 } }),
    prisma.item.create({ data: { name: "반창고 (대)", sku: "MED-006", categoryId: catMedical.id, unit: "ROLL", manufacturer: "(주)메디밴드", safetyStock: 25 } }),
    prisma.item.create({ data: { name: "소독용 에탄올 500ml", sku: "MED-007", categoryId: catPharm.id, unit: "BOTTLE", manufacturer: "녹십자", safetyStock: 15, expiryManaged: true } }),
    prisma.item.create({ data: { name: "혈압계 커프", sku: "EQP-001", categoryId: catEquip.id, unit: "EA", manufacturer: "(주)바이오닉스", safetyStock: 5 } }),
    prisma.item.create({ data: { name: "체온계 (비접촉)", sku: "EQP-002", categoryId: catEquip.id, unit: "EA", manufacturer: "(주)메디템프", safetyStock: 3 } }),
    prisma.item.create({ data: { name: "A4 복사용지", sku: "GEN-001", categoryId: catGeneral.id, unit: "BOX", manufacturer: "한솔제지", safetyStock: 10 } }),
  ]);

  // Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: "(주)한국의료공급", contactName: "이공급", phone: "02-1234-5678", email: "supply@komed.co.kr", address: "서울시 강남구" } }),
    prisma.supplier.create({ data: { name: "(주)메디서플라이", contactName: "김의료", phone: "02-2345-6789", email: "info@medisupply.kr", address: "서울시 서초구" } }),
    prisma.supplier.create({ data: { name: "JW중외제약", contactName: "박제약", phone: "02-3456-7890", email: "order@jw.co.kr", address: "서울시 종로구" } }),
  ]);

  // Storage Locations
  const locations = await Promise.all([
    prisma.storageLocation.create({ data: { code: "1F-A-01", name: "1층 약품창고 A-01", floor: "1F", zone: "A", shelf: "01", qrCodeData: '{"type":"location","code":"1F-A-01"}' } }),
    prisma.storageLocation.create({ data: { code: "1F-A-02", name: "1층 약품창고 A-02", floor: "1F", zone: "A", shelf: "02", qrCodeData: '{"type":"location","code":"1F-A-02"}' } }),
    prisma.storageLocation.create({ data: { code: "1F-B-01", name: "1층 소모품 창고 B-01", floor: "1F", zone: "B", shelf: "01", qrCodeData: '{"type":"location","code":"1F-B-01"}' } }),
    prisma.storageLocation.create({ data: { code: "2F-A-01", name: "2층 진료실 보관함 A-01", floor: "2F", zone: "A", shelf: "01", qrCodeData: '{"type":"location","code":"2F-A-01"}' } }),
    prisma.storageLocation.create({ data: { code: "2F-A-02", name: "2층 진료실 보관함 A-02", floor: "2F", zone: "A", shelf: "02", qrCodeData: '{"type":"location","code":"2F-A-02"}' } }),
    prisma.storageLocation.create({ data: { code: "2F-B-01", name: "2층 시술실 보관함 B-01", floor: "2F", zone: "B", shelf: "01", qrCodeData: '{"type":"location","code":"2F-B-01"}' } }),
    prisma.storageLocation.create({ data: { code: "3F-A-01", name: "3층 장비실 A-01", floor: "3F", zone: "A", shelf: "01", qrCodeData: '{"type":"location","code":"3F-A-01"}' } }),
  ]);

  // Inventory Stocks
  await Promise.all([
    prisma.inventoryStock.create({ data: { itemId: items[0].id, locationId: locations[0].id, quantity: 200, lotNumber: "L2026-001" } }),
    prisma.inventoryStock.create({ data: { itemId: items[0].id, locationId: locations[3].id, quantity: 50, lotNumber: "L2026-001" } }),
    prisma.inventoryStock.create({ data: { itemId: items[1].id, locationId: locations[0].id, quantity: 45, lotNumber: "L2026-002" } }),
    prisma.inventoryStock.create({ data: { itemId: items[2].id, locationId: locations[2].id, quantity: 30 } }),
    prisma.inventoryStock.create({ data: { itemId: items[3].id, locationId: locations[0].id, quantity: 80, lotNumber: "L2026-003", expiryDate: new Date("2027-06-30") } }),
    prisma.inventoryStock.create({ data: { itemId: items[4].id, locationId: locations[2].id, quantity: 60 } }),
    prisma.inventoryStock.create({ data: { itemId: items[5].id, locationId: locations[2].id, quantity: 35 } }),
    prisma.inventoryStock.create({ data: { itemId: items[6].id, locationId: locations[0].id, quantity: 20, expiryDate: new Date("2027-03-31") } }),
    prisma.inventoryStock.create({ data: { itemId: items[7].id, locationId: locations[6].id, quantity: 8 } }),
    prisma.inventoryStock.create({ data: { itemId: items[8].id, locationId: locations[6].id, quantity: 5 } }),
    prisma.inventoryStock.create({ data: { itemId: items[9].id, locationId: locations[2].id, quantity: 15 } }),
    // Some items in 2F locations
    prisma.inventoryStock.create({ data: { itemId: items[1].id, locationId: locations[4].id, quantity: 10 } }),
    prisma.inventoryStock.create({ data: { itemId: items[2].id, locationId: locations[5].id, quantity: 15 } }),
    prisma.inventoryStock.create({ data: { itemId: items[4].id, locationId: locations[5].id, quantity: 20 } }),
  ]);

  // Label Printer Settings
  await prisma.systemSetting.upsert({
    where: { key: "label_printer" },
    update: {},
    create: {
      key: "label_printer",
      value: { ip: "", port: 9100, labelWidth: 60, labelHeight: 40 },
    },
  });

  console.log("Seed completed!");
  console.log("Test accounts:");
  console.log("  Admin: admin@hospital.com / admin123");
  console.log("  Manager: manager@hospital.com / manager123");
  console.log("  Staff: staff@hospital.com / staff123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
