import { PrismaClient, Role, RequestStatus, DocType, SourceKind, NotifTone, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash password for demo accounts
  const passwordHash = await bcrypt.hash("demo123", 10);

  // 1. Seed Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: "aarav@demo.ink" },
    update: { passwordHash },
    create: {
      name: "Aarav Mehta",
      email: "aarav@demo.ink",
      passwordHash,
      role: Role.USER,
      phone: "+91 98000 00000",
    },
  });

  // 2. Seed Demo Admin
  const demoAdmin = await prisma.user.upsert({
    where: { email: "admin@demo.ink" },
    update: { passwordHash },
    create: {
      name: "Archive Admin",
      email: "admin@demo.ink",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Users seeded: User (${demoUser.email}), Admin (${demoAdmin.email})`);

  // 2b. Seed Razorpay SystemSettings
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      razorpayKeyId: "rzp_test_TflwpulcLtIS0O",
      razorpayKeySecret: "ZdnzwpP946i4HxScAhg6VdCc",
    },
    create: {
      id: "default",
      razorpayKeyId: "rzp_test_TflwpulcLtIS0O",
      razorpayKeySecret: "ZdnzwpP946i4HxScAhg6VdCc",
    },
  });

  console.log("SystemSettings seeded with Razorpay credentials.");

  // 3. Seed Demo Requests
  const req1 = await prisma.docRequest.upsert({
    where: { id: "REQ-2417" },
    update: {},
    create: {
      id: "REQ-2417",
      userId: demoUser.id,
      status: RequestStatus.UNDER_REVIEW,
      submittedAt: new Date("2026-02-18T09:40:00Z"),
      updatedAt: new Date("2026-02-18T09:40:00Z"),
      document: {
        create: {
          kind: SourceKind.FILE,
          fileName: "Colonial Land Deed 1874.pdf",
          fileType: DocType.PDF,
          fileSize: 5033165,
        },
      },
      requirements: {
        create: {
          fullName: "Aarav Mehta",
          age: "34",
          gender: "Male",
          email: "aarav@demo.ink",
          phone: "+91 98000 00000",
          address: "Demo Road, Indiranagar, Bengaluru",
          purpose: "This is a land deed from 1874 written in a dense formal hand.",
          processing: "Full transcription of the deed in plain modern language.",
          outputFormat: "PDF (clean transcription)",
          instructions: "Please keep original legal terms in brackets.",
          notes: "Page 2 has a water-damaged corner.",
        },
      },
    },
  });

  const req2 = await prisma.docRequest.upsert({
    where: { id: "REQ-2416" },
    update: {},
    create: {
      id: "REQ-2416",
      userId: demoUser.id,
      status: RequestStatus.QUOTE_AVAILABLE,
      submittedAt: new Date("2026-02-10T14:15:00Z"),
      updatedAt: new Date("2026-02-13T11:05:00Z"),
      document: {
        create: {
          kind: SourceKind.FILE,
          fileName: "Family letters (1922–1931)",
          fileType: DocType.IMAGES,
          fileSize: 32842893,
          fileCount: 14,
        },
      },
      requirements: {
        create: {
          fullName: "Aarav Mehta",
          email: "aarav@demo.ink",
          purpose: "Fourteen letters my great-grandmother wrote during 1922–1931.",
          processing: "Transcription of all letters.",
          outputFormat: "Word document",
          instructions: "Mark illegible words with [illegible].",
        },
      },
      quote: {
        create: {
          charge: 1450,
          estimatedDays: 5,
          expectedDate: new Date("2026-02-20T00:00:00Z"),
          adminMessage: "We have examined the letter images. The handwriting is faint in places but workable.",
          extraInstructions: "We will transcribe each letter on its own page.",
          sentAt: new Date("2026-02-13T11:05:00Z"),
        },
      },
    },
  });

  // 4. Seed Notifications
  await prisma.appNotification.createMany({
    data: [
      {
        forRole: Role.USER,
        userId: demoUser.id,
        requestId: req1.id,
        title: "Your request has been received.",
        body: "Request REQ-2417 (Colonial Land Deed 1874.pdf) is now under review by our team.",
        tone: NotifTone.INFO,
        read: false,
        createdAt: new Date("2026-02-18T09:41:00Z"),
      },
      {
        forRole: Role.USER,
        userId: demoUser.id,
        requestId: req2.id,
        title: "Your quotation is ready.",
        body: "The quote for request REQ-2416 (Family letters) is ready. Approve it and pay to begin processing.",
        tone: NotifTone.SUCCESS,
        read: false,
        createdAt: new Date("2026-02-13T11:06:00Z"),
      },
      {
        forRole: Role.ADMIN,
        title: "New request submitted.",
        body: "Aarav Mehta submitted request REQ-2417 — Colonial Land Deed 1874.pdf. It is waiting for review.",
        tone: NotifTone.INFO,
        read: false,
        createdAt: new Date("2026-02-18T09:41:00Z"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
