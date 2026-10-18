import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, and: vi.fn(), eq: vi.fn(), desc: vi.fn(), isNull: vi.fn(), count: vi.fn(), gte: vi.fn(), lte: vi.fn(), like: vi.fn(), or: vi.fn() };
});

vi.mock("../db", () => ({ getDb: vi.fn(), recordUserActivity: vi.fn() }));
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { and, count, eq, gte, isNull, like, lte, or } from "drizzle-orm";
import { savedCertificates } from "../../drizzle/schema";
import { getDb, recordUserActivity } from "../db";
import { storagePut } from "../storage";
import { certificatesRouter } from "./certificates";

const pdfDataUrl = `data:application/pdf;filename=generated.pdf;base64,${Buffer.from("%PDF-1.7 test certificate").toString("base64")}`;
const previewDataUrl = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([255, 216]), Buffer.alloc(30), Buffer.from([255, 217])]).toString("base64")}`;

function listChain(rows: unknown[]) {
  const limit = vi.fn().mockReturnValue({ offset: vi.fn().mockResolvedValue(rows) });
  return { from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit })) })) })) };
}
function countChain(total: number) { return { from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ total }]) })) }; }
function paginatedDb(rows: unknown[], total: number) {
  const dataChain = listChain(rows);
  const countResult = {};
  vi.mocked(count).mockReturnValue(countResult as never);
  return { select: vi.fn((projection: Record<string, unknown>) => projection.total === countResult ? countChain(total) : dataChain) };
}
function updateChain() {
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn(() => ({ where }));
  return { update: vi.fn(() => ({ set })), set, where };
}

describe("certificates.save", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uploads a validated PDF and JPEG preview for the authenticated user", async () => {
    const values = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ insertId: 7 }]) });
    const db = { insert: vi.fn(() => ({ values })) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    vi.mocked(storagePut).mockResolvedValueOnce({ key: "certificates/42/asset/healthy-habits-certificate.pdf", url: "/manus-storage/certificates/42/asset/certificate.pdf" }).mockResolvedValueOnce({ key: "certificates/42/asset/healthy-habits-certificate.jpg", url: "/manus-storage/certificates/42/asset/certificate.jpg" });
    const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.save({ childName: "  Alex   Rivera ", pdfDataUrl, previewDataUrl })).resolves.toEqual({ id: 7, fileUrl: "/manus-storage/certificates/42/asset/certificate.pdf", previewUrl: "/manus-storage/certificates/42/asset/certificate.jpg", saved: true });
    expect(storagePut).toHaveBeenNthCalledWith(1, expect.stringMatching(/^certificates\/42\/.*\.pdf$/), expect.any(Buffer), "application/pdf");
    expect(storagePut).toHaveBeenNthCalledWith(2, expect.stringMatching(/^certificates\/42\/.*\.jpg$/), expect.any(Buffer), "image/jpeg");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, childName: "Alex Rivera", title: "Healthy Habits certificate for Alex Rivera", previewKey: "certificates/42/asset/healthy-habits-certificate.jpg", previewUrl: "/manus-storage/certificates/42/asset/certificate.jpg" }));
    expect(recordUserActivity).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, eventType: "certificate_saved", sourceRef: "7" }));
  });
  it("rejects invalid PDF or preview payloads before uploading", async () => {
    const db = { insert: vi.fn() };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.save({ childName: "Alex", pdfDataUrl: `data:application/pdf;base64,${Buffer.from("not a PDF").toString("base64")}`, previewDataUrl })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    await expect(caller.save({ childName: "Alex", pdfDataUrl, previewDataUrl: `data:image/png;base64,${Buffer.from("not a PNG ".repeat(4)).toString("base64")}` })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(storagePut).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("certificates.list", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns paginated metadata scoped to the authenticated user", async () => {
    const rows = [{ id: 7, childName: "Alex Rivera", title: "Healthy Habits certificate for Alex Rivera", fileUrl: "/manus-storage/certificate.pdf", previewUrl: "/manus-storage/certificate.jpg", archivedAt: null, createdAt: new Date() }];
    const db = paginatedDb(rows, 17);
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.list({ page: 2, pageSize: 8, search: "Alex", from: "2026-01-01", to: "2026-12-31", includeArchived: false })).resolves.toEqual({ items: rows, page: 2, pageSize: 8, total: 17, totalPages: 3, filters: { search: "Alex", from: "2026-01-01", to: "2026-12-31", includeArchived: false } });
    expect(count).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith(savedCertificates.userId, 42);
    expect(isNull).toHaveBeenCalledWith(savedCertificates.archivedAt);
    expect(like).toHaveBeenCalledWith(savedCertificates.title, "%Alex%");
    expect(like).toHaveBeenCalledWith(savedCertificates.childName, "%Alex%");
    expect(or).toHaveBeenCalled();
    expect(gte).toHaveBeenCalledWith(savedCertificates.createdAt, new Date("2026-01-01T00:00:00.000Z"));
    expect(lte).toHaveBeenCalledWith(savedCertificates.createdAt, new Date("2026-12-31T23:59:59.999Z"));
  });
  it("can include archived records without applying the active-only filter", async () => {
    const rows = [{ id: 8, childName: "Jamie", title: "Healthy Habits certificate for Jamie", fileUrl: "/certificate.pdf", previewUrl: null, archivedAt: new Date(), createdAt: new Date() }];
    const db = paginatedDb(rows, 1);
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.list({ page: 1, pageSize: 12, includeArchived: true })).resolves.toMatchObject({ items: rows, total: 1, totalPages: 1 });
    expect(isNull).not.toHaveBeenCalled();
  });
});

describe("certificates lifecycle controls", () => {
  beforeEach(() => vi.clearAllMocks());
  it("archives and restores only a certificate owned by the authenticated user", async () => {
    const archiveDb = updateChain(); vi.mocked(getDb).mockResolvedValue(archiveDb as never);
    const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.archive({ id: 7 })).resolves.toEqual({ id: 7, archived: true });
    expect(archiveDb.set).toHaveBeenCalledWith(expect.objectContaining({ archivedAt: expect.any(Date) }));
    expect(eq).toHaveBeenCalledWith(savedCertificates.userId, 42); expect(and).toHaveBeenCalled();
    const restoreDb = updateChain(); vi.mocked(getDb).mockResolvedValue(restoreDb as never);
    await expect(caller.restore({ id: 7 })).resolves.toEqual({ id: 7, archived: false });
    expect(restoreDb.set).toHaveBeenCalledWith({ archivedAt: null }); expect(eq).toHaveBeenCalledWith(savedCertificates.userId, 42);
  });
  it("permanently deletes only the authenticated user's record", async () => {
    const where = vi.fn().mockResolvedValue([]); const db = { delete: vi.fn(() => ({ where })) };
    vi.mocked(getDb).mockResolvedValue(db as never); const caller = certificatesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.delete({ id: 9 })).resolves.toEqual({ id: 9, deleted: true });
    expect(db.delete).toHaveBeenCalledWith(savedCertificates); expect(where).toHaveBeenCalled(); expect(eq).toHaveBeenCalledWith(savedCertificates.userId, 42);
  });
});
