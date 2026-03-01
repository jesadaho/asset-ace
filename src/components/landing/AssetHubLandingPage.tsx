"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Phone,
  UserCheck,
  FileCheck,
  TrendingUp,
  Bell,
  Database,
  FileText,
  Users,
  Headphones,
  BedDouble,
  Bath,
  Square,
  MapPin,
  Mail,
  ChevronDown,
  Facebook,
  Instagram,
} from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: "easeOut" },
};

const TEAL = "#0d9488";
const TRUST_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

export function AssetHubLandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-white text-[#0F172A]">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#0F172A]"
          >
            <Image
            src="/porjai-logo.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
            aria-hidden
          />
            Porjai by AssetHub
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900">
              ฟีเจอร์
            </a>
            <a href="#services" className="text-sm text-slate-600 hover:text-slate-900">
              บริการ
            </a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900">
              คำถามที่พบบ่อย
            </a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-slate-900">
              ติดต่อเรา
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/enter"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="#line-cta"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg px-4 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              เริ่มฝากห้องฟรี
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 2. Hero (two columns) */}
        <motion.section
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <span
                className="inline-block rounded-full px-4 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: TEAL }}
              >
                • Porjai x AssetHub
              </span>
              <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                จัดการคอนโดและบ้านให้เช่า
                <br />
                <span style={{ color: TEAL }}>ไม่ต้องปวดหัว</span>
              </h1>
              <p className="mt-4 max-w-lg text-slate-600">
                พอใจคือผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านให้เช่าของคุณบน AssetHub
                ให้คุณมีเวลาทำอย่างอื่นมากขึ้น
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="#line-cta"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: TEAL }}
                >
                  เริ่มฝากห้องฟรี →
                </Link>
                <a
                  href="#line-cta"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#06C755] text-white">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  คุยกับเราทาง LINE
                </a>
              </div>
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Image
                  src="/porjai-logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 object-contain"
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-slate-900">สวัสดีครับ! ผมชื่อพอใจ</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    ผมช่วยจัดการห้องให้เช่า ตั้งแต่หาผู้เช่า จนถึงติดตามค่าเช่า
                    ให้คุณสบายใจ
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-[280px] rounded-[2.5rem] border-4 border-slate-800 bg-slate-900 p-2 shadow-2xl">
                <div className="absolute left-1/2 top-4 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-800" />
                <div className="relative mt-6 aspect-[9/19] w-full overflow-hidden rounded-[1.5rem] bg-white">
                  <Image
                    src="/hero-dashboard-preview.png"
                    alt="Asset Ace dashboard preview"
                    fill
                    className="object-cover object-top"
                    sizes="280px"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. Connected Platforms */}
        <motion.section
          className="border-y border-slate-200 bg-slate-50 py-10"
          {...reveal}
        >
          <p className="text-center text-sm font-medium text-slate-500">
            แพลตฟอร์มที่เชื่อมต่อกับเรา
          </p>
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 sm:gap-10">
            <span className="flex items-center gap-2 text-slate-500">AssetHub</span>
            <span className="flex items-center gap-2 text-slate-500">Facebook Marketplace</span>
            <span className="flex items-center gap-2 text-slate-500">Line OA</span>
            <span className="flex items-center gap-2 text-slate-500">LivingInsider</span>
            <span className="flex items-center gap-2 text-slate-500">DDproperty</span>
          </div>
        </motion.section>

        {/* 4. Problem Statement + 3 Cards */}
        <motion.section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
          {...reveal}
        >
          <p className="text-center text-sm font-semibold" style={{ color: TEAL }}>
            ปัญหาที่คุณต้องเจอ
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            เบื่อไหมกับปัญหาเดิมๆ ของคนมีห้องให้เช่า?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-white">
                <Image
                  src="/painpoint-1.png"
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">
                  คอนโดหลักล้าน แต่ทำไมบริหารวุ่นวายเหมือนแผงลอย?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  ข้อมูลกระจัดกระจายในแชท เอเจนท์ทักถามซ้ำๆ รูปหาย ไฟล์หมดอายุ ต้องส่งใหม่ไม่จบไม่สิ้น
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-white">
                <Image
                  src="/painpoint-2.png"
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">
                  ห้องว่าง 1 วัน คือเงินที่หายไป... คุณเรียกคืนไม่ได้
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  กว่าเอเจนท์จะรู้ว่าห้องว่าง หรือกว่าคุณจะประกาศเสร็จ รายได้ก็หายไปหลายวันเพราะความล่าช้าของข้อมูล
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-white">
                <Image
                  src="/painpoint-3.png"
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">
                  รับสายจนสายไหม้ แต่ปิดดีลไม่ได้
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  พูดกับ Agent หลายสิบคน ข้อมูลไม่ตรงกัน ต้องไล่ตามสถานะเอง
                </p>
              </div>
            </article>
          </div>
        </motion.section>

        {/* 5. Porjai Solution (4 cards) */}
        <motion.section
          id="services"
          className="border-t border-slate-200 bg-slate-50 py-16"
          {...reveal}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Image
                src="/porjai-logo.png"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 object-contain"
                aria-hidden
              />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: TEAL }}>
                PORJAI SOLUTION
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
              ให้ &apos;พอใจ&apos; จัดการให้คุณ ทุกอย่างง่ายขึ้น
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              เรานำเทคโนโลยีมาช่วยจัดการเรื่องวุ่นวาย ให้คุณมีเวลาไปใช้ชีวิตในแบบที่ต้องการ
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <UserCheck className="h-10 w-10 text-slate-700" />
                <h3 className="mt-4 font-semibold text-slate-900">คัดกรองผู้เช่าคุณภาพ</h3>
                <p className="mt-2 text-sm text-slate-600">
                  ระบบ Tenant Screening ช่วยกรองผู้สนใจให้เหลือเฉพาะคนที่เหมาะสม
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <FileCheck className="h-10 w-10 text-slate-700" />
                <h3 className="mt-4 font-semibold text-slate-900">จัดการสัญญามาตรฐาน</h3>
                <p className="mt-2 text-sm text-slate-600">
                  สัญญาเช่ามาตรฐาน จัดการเรื่องกฎหมาย เช็คอิน-เช็คเอาท์ให้ครบ
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <TrendingUp className="h-10 w-10 text-slate-700" />
                <h3 className="mt-4 font-semibold text-slate-900">สรุปภาพรวมการเงิน</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Dashboard แสดงรายรับ-รายจ่ายแบบเรียลไทม์ เห็นภาพรวมทุกทรัพย์
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">ติดตามค่าเช่าอัตโนมัติ</h3>
                <p className="mt-2 text-sm text-slate-600">
                  แจ้งเตือนเมื่อถึงกำหนดรับค่าเช่า ติดตามการชำระเงินให้ไม่พลาด
                </p>
              </article>
            </div>
          </div>
        </motion.section>

        {/* 6. What Can Porjai Do (4 cards 2x2) */}
        <motion.section
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
          {...reveal}
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            พอใจทําอะไรได้บ้าง
          </h2>
          <p className="mt-1 text-slate-600">ฟีเจอร์อัพเดทล่าสุดเพื่อเจ้าของทรัพย์สิน</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">ระบบบันทึกสถานะสินทรัพย์</h3>
              <p className="mt-2 text-sm text-slate-600">
                บันทึกสถานะห้องว่าง กำลังเช่า อยู่ระหว่างสัญญา ดูภาพรวมได้ใน Dashboard
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">สรุปภาพรวมการเงิน & ภาษี</h3>
              <p className="mt-2 text-sm text-slate-600">
                รายรับ-รายจ่ายสรุปตามเดือน/ปี พร้อมข้อมูลสำหรับยื่นภาษี
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">จัดการหาตัวแทนอัตโนมัติ</h3>
              <p className="mt-2 text-sm text-slate-600">
                ส่งคำเชิญให้ตัวแทนในเครือข่าย รับคำตอบและมอบหมายงานได้ในระบบ
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Headphones className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">ศูนย์รับแจ้งเรื่องจากผู้เช่า</h3>
              <p className="mt-2 text-sm text-slate-600">
                ผู้เช่าส่งเรื่องแจ้งซ่อมหรือสอบถามผ่าน LINE ได้ ติดตามสถานะจนจบ
              </p>
            </article>
          </div>
        </motion.section>

        {/* 7. Trust and Visibility */}
        <motion.section
          className="border-t border-slate-200 bg-slate-50 py-16"
          {...reveal}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={TRUST_IMAGE}
                    alt="The Bangkok Thonglor"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <span
                    className="absolute left-3 top-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    Verified by Porjai
                  </span>
                </div>
                <div className="p-4">
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> สุขุมวิท 39
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-900">The Bangkok Thonglor</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-4 w-4" /> 1 ห้องนอน
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-4 w-4" /> 1 ห้องน้ำ
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Square className="h-4 w-4" /> 45 ตร.ม.
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">฿35,000/เดือน</p>
                  <p className="mt-1 text-sm text-slate-600">ดูแลโดย Porjai Team • ตอบกลับภายใน 5 นาที</p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    ติดต่อ
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: TEAL }}>
                  Trust & Visibility
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  ทรัพย์สินของคุณจะถูก{" "}
                  <span style={{ color: TEAL }}>Verified</span> บน AssetHub.in.th
                </h2>
                <p className="mt-4 text-slate-600">
                  ประกาศที่ผ่านการตรวจสอบจาก Porjai จะได้ความน่าเชื่อถือสูง ปิดดีลได้เร็วขึ้น 2 เท่า
                  จากผู้ใช้กว่า 100,000 คนบนแพลตฟอร์ม
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                    แบดจ์ Verified บนประกาศ
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                    โปรโมทอัตโนมัติในแพลตฟอร์ม
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                    บริการถ่ายภาพฟรี (เมื่อมีโปรโมชัน)
                  </li>
                </ul>
                <Link
                  href="#"
                  className="mt-8 inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: TEAL }}
                >
                  ดูตัวอย่างประกาศบน AssetHub →
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 8. LINE Add Friend */}
        <motion.section
          id="line-cta"
          className="bg-slate-900 py-16 text-white"
          {...reveal}
        >
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <Image
            src="/porjai-logo.png"
            alt=""
            width={48}
            height={48}
            className="mx-auto h-12 w-12 shrink-0 object-contain"
            aria-hidden
          />
            <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
              กดเพิ่มเพื่อนกับ &apos;พอใจ&apos; ได้ง่ายๆ
            </h2>
            <p className="mt-4 text-slate-300">
              แนะนำบริการฟรี ไม่มีข้อผูกมัด เพิ่ม LINE แล้วทีมงานจะติดต่อกลับเพื่อปรึกษาความต้องการของคุณ
            </p>
            <a
              href="https://line.me/ti/p/~porjai_assethub"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#06C755] px-8 py-4 text-lg font-semibold text-white hover:bg-[#05b04c]"
            >
              <MessageCircle className="h-7 w-7" />
              เพิ่มเพื่อนเพื่อเริ่มฝากห้อง
            </a>
            <p className="mt-6 text-sm text-slate-400">
              หรือค้นหา ID: @porjai_assethub
            </p>
          </div>
        </motion.section>

        {/* 9. FAQ Accordion */}
        <motion.section
          id="faq"
          className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8"
          {...reveal}
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            คำถามที่พบบ่อย
          </h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "มีค่าบริการเท่าไหร่?",
                a: "บริการฝากเช่าผ่าน Porjai มีหลายแพ็กเกจ คุณสามารถสอบถามรายละเอียดและราคาได้ฟรีผ่าน LINE หลังจากเพิ่มเพื่อนกับพอใจ",
              },
              {
                q: "ต้องมอบอำนาจไหม?",
                a: "ขึ้นอยู่กับระดับบริการที่คุณเลือก บางแพ็กเกจเราจัดการให้แบบเต็มรูปแบบ บางแบบเป็นเพียงการช่วยโพสต์และติดตาม เราจะอธิบายให้ชัดก่อนเริ่มใช้บริการ",
              },
              {
                q: "AssetHub ต่างจากเว็บประกาศอื่นอย่างไร?",
                a: "AssetHub เชื่อมกับหลายแพลตฟอร์มและมี Porjai เป็นผู้ช่วยส่วนตัวผ่าน LINE ช่วยจัดการตั้งแต่หาผู้เช่า ติดตามค่าเช่า และสรุปการเงิน ให้คุณเห็นภาพรวมในที่เดียว",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-slate-900 hover:bg-slate-100/80"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                >
                  {item.q}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                      faqOpen === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="border-t border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* 10. Footer (4 columns) */}
        <motion.footer
          id="contact"
          className="border-t border-slate-200 bg-slate-100 py-14"
          {...reveal}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/porjai-logo.png"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 object-contain"
                    aria-hidden
                  />
                  <span className="font-bold text-slate-900">Porjai.</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  ผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านให้เช่าบน AssetHub ให้คุณมีเวลาทำอย่างอื่นมากขึ้น
                </p>
                <div className="mt-4 flex gap-3">
                  <a href="#" className="text-slate-500 hover:text-slate-700" aria-label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-slate-500 hover:text-slate-700" aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#line-cta" className="text-slate-500 hover:text-slate-700" aria-label="LINE">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">บริการ</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li><Link href="#">ฝากเช่าคอนโด</Link></li>
                  <li><Link href="#">ฝากขายคอนโด</Link></li>
                  <li><Link href="#">ค้นหาที่พัก</Link></li>
                  <li><Link href="#">บริการจัดการสินทรัพย์</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">บริษัท</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li><Link href="#">เกี่ยวกับเรา</Link></li>
                  <li><Link href="#">ร่วมงานกับเรา</Link></li>
                  <li><Link href="#">บทความ</Link></li>
                  <li><Link href="#">ติดต่อเรา</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">ติดต่อ</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    123 อาคารสาทรไพรม์ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    02-123-4567
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    hello@porjai.co
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} Porjai by AssetHub. All rights reserved.
            </p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
