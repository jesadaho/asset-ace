"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Phone,
  Database,
  FileText,
  FileCheck,
  Bell,
  Users,
  Headphones,
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

const TEAL = "#55A9BC";

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
        {/* 2. Hero (cover hero – two columns) */}
        <motion.section
          className="relative mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
            {/* Left: copy + CTAs + mascot — on mobile show after illustration (order-2) */}
            <div className="order-2 max-w-xl lg:order-1">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: TEAL }}
              >
                Porjai x AssetHub
              </span>
              <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                ปล่อยเช่าแบบ &apos;พอใจ&apos;
                <br />
                <span style={{ color: TEAL }}>ไม่ต้องปวดหัว</span>
                <br />
                <span className="text-slate-900">เรื่องการหาผู้เช่าและติดตามค่าเช่า</span>
              </h1>
              <p className="mt-4 text-slate-600">
                ผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านของคุณครบวงจร พร้อมยกระดับทรัพย์สินของคุณบน AssetHub แพลตฟอร์มมาตรฐานสากล
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="#line-cta"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: TEAL }}
                >
                  เริ่มฝากห้องฟรี →
                </Link>
                <a
                  href="#line-cta"
                  className="inline-flex items-center gap-2 rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  style={{ borderColor: TEAL }}
                >
                  <Image
                    src="/line-icon.png"
                    alt="LINE"
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                  คุยกับเราทาง LINE
                </a>
              </div>
              <div className="mt-8 flex items-center gap-3">
                  <Image
                    src="/porjai-logo.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 object-contain"
                    aria-hidden
                  />
                  {/* Speech bubble with tail pointing to owl */}
                  <div className="relative rounded-2xl border-2 bg-white px-4 py-3 shadow-sm" style={{ borderColor: TEAL }}>
                    {/* Tail (left-pointing triangle) – border */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{
                        left: "-10px",
                        width: 0,
                        height: 0,
                        borderTop: "8px solid transparent",
                        borderBottom: "8px solid transparent",
                        borderRight: `10px solid ${TEAL}`,
                      }}
                      aria-hidden
                    />
                    {/* Tail – fill */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{
                        left: "-8px",
                        width: 0,
                        height: 0,
                        borderTop: "7px solid transparent",
                        borderBottom: "7px solid transparent",
                        borderRight: "9px solid white",
                      }}
                      aria-hidden
                    />
                    <p className="text-sm text-slate-800">
                      สวัสดีครับ! ผมชื่อพอใจ
                      <br />
                      พร้อมดูแลทรัพย์สินของคุณแล้ว 🦉
                    </p>
                  </div>
              </div>
            </div>

            {/* Right: hero illustration — on mobile show first (order-1) */}
            <div className="order-1 relative flex justify-center lg:order-2 lg:-ml-12 lg:justify-end">
              <div className="relative w-full max-w-[420px] aspect-[4/3] lg:max-w-[520px]" aria-hidden>
                <Image
                  src="/hero-illustration.png"
                  alt="พอใจ – บริหารคอนโดและบ้านเช่า"
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 90vw, 520px"
                  priority
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. Porjai Solution (3 cards) */}
        <motion.section
          id="features"
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
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-white">
                  <Image
                    src="/solution-1.png"
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900">
                    บริหารคอนโดและบ้านเช่าง่าย... เหมือนสั่งอาหาร
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    อัปเดตสถานะห้องง่ายแค่ปลายนิ้ว เอเจนต์เห็นปุ๊บ จองปั๊บ
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li>ลดขั้นตอนประสานงาน ให้การปล่อยเช่าไหลลื่นและรวดเร็ว</li>
                  </ul>
                </div>
              </article>
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-white">
                  <Image
                    src="/solution-2.png"
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900">
                    สรุปภาพรวมการเงิน... ครบในหน้าเดียว
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Dashboard เรียลไทม์ เห็นสรุปยอดทุกทรัพย์สินได้ทันที
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li>จัดเก็บไฟล์และเอกสารสำคัญเป็นระเบียบ ค้นหาง่าย</li>
                  </ul>
                </div>
              </article>
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-white">
                  <Image
                    src="/solution-3.png"
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900">
                    ติดตามค่าเช่าอัตโนมัติ... แม่นยำทุกรายการ
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    ระบบแจ้งเตือนและติดตามการชำระเงินให้อัตโนมัติ
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li>ตรวจสอบสถานะได้ทันที ไม่ต้องคอยเช็กแชทให้ลำบากใจ</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </motion.section>

        {/* 5. What Can Porjai Do (6 cards 2x3) */}
        <motion.section
          id="services"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
          {...reveal}
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            พอใจทำอะไรได้บ้าง?
          </h2>
          <p className="mt-1 text-slate-600">ฟีเจอร์อัพเดทล่าสุดเพื่อเจ้าของทรัพย์สิน</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">ระบบบันทึกสถานะสินทรัพย์</h3>
              <p className="mt-2 text-sm text-slate-600">
                บันทึกสถานะห้องว่าง กำลังเช่า หรืออยู่ระหว่างสัญญา ดูภาพรวมทรัพย์สินทั้งหมดได้ทันทีผ่าน Dashboard
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">สรุปภาพรวมการเงิน & ภาษี</h3>
              <p className="mt-2 text-sm text-slate-600">
                รวบรวมรายรับ-รายจ่าย สรุปแยกตามเดือนและปี เตรียมข้อมูลให้พร้อมสำหรับนำไปยื่นภาษีได้ทันที
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">สร้างสัญญาเช่าดิจิทัล</h3>
              <p className="mt-2 text-sm text-slate-600">
                ออกเอกสารสัญญาเช่ามาตรฐานผ่านระบบได้รวดเร็ว ลดขั้นตอนการจัดเตรียมเอกสารและจัดเก็บไฟล์ให้เป็นระเบียบ
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">ติดตามค่าเช่าอัตโนมัติ</h3>
              <p className="mt-2 text-sm text-slate-600">
                ระบบแจ้งเตือนเมื่อถึงกำหนดชำระ และยืนยันยอดเงินโอน ช่วยให้คุณไม่ต้องคอยเช็กสลิปหรือทวงถามด้วยตัวเอง
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">จัดการหาตัวแทนอัตโนมัติ</h3>
              <p className="mt-2 text-sm text-slate-600">
                ส่งคำเชิญให้ตัวแทนในเครือข่ายช่วยปล่อยเช่าได้ในคลิกเดียว รับคำตอบและมอบหมายงานได้ครบจบในระบบเดียว
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Headphones className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">ศูนย์รับแจ้งเรื่องจากผู้เช่า</h3>
              <p className="mt-2 text-sm text-slate-600">
                ผู้เช่าแจ้งซ่อมหรือสอบถามผ่าน LINE ได้โดยตรง เจ้าของติดตามสถานะการแก้ไขได้จนจบงาน
              </p>
            </article>
          </div>
        </motion.section>

        {/* 7. Trust and Visibility */}
        <motion.section
          className="border-t border-slate-200 bg-white py-12 sm:py-16"
          {...reveal}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-14 sm:gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
              {/* Left: property listing card – max 380px, slight tilt, hover to straighten */}
              <div className="mx-auto w-full max-w-[380px] -rotate-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform duration-300 ease-out hover:rotate-0 lg:mx-0">
                <div className="relative aspect-[16/9] bg-slate-100">
                  <Image
                    src="/trust-card-image.png"
                    alt="The Bangkok Thonglor"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <span
                    className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    <MapPin className="h-3.5 w-3.5" /> สุขุมวิท 39
                  </span>
                  <span
                    className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    ✓ Verified by Porjai
                  </span>
                </div>
                <div className="p-5 sm:p-4">
                  <h3 className="font-semibold text-slate-900">The Bangkok Thonglor</h3>
                  <p className="mt-2 text-sm text-slate-600">1 ห้องนอน - 1 ห้องน้ำ - 45 ตร.ม.</p>
                  <p className="mt-3 font-semibold text-slate-900">฿35,000 / เดือน</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Image
                      src="/porjai-logo.png"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] shrink-0 object-contain"
                      aria-hidden
                    />
                    ดูแลโดย Porjai Team ตอบกลับภายใน 5 นาที
                  </p>
                  <button
                    type="button"
                    className="mt-6 w-full rounded-xl py-3 text-sm font-medium text-white sm:mt-4 sm:py-2.5"
                    style={{ backgroundColor: TEAL }}
                  >
                    ติดต่อ
                  </button>
                </div>
              </div>
              {/* Right: Trust & Visibility copy – more spacing on mobile */}
              <div className="pt-2 sm:pt-0">
                <p className="text-sm font-semibold" style={{ color: TEAL }}>
                  Trust & Visibility
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-snug text-slate-900 sm:mt-2 sm:text-3xl sm:leading-tight">
                  ทรัพย์สินของคุณจะถูก{" "}
                  <span style={{ color: TEAL }}>Verified</span> บน AssetHub.in.th
                </h2>
                <p className="mt-5 leading-relaxed text-slate-600 sm:mt-4">
                  เพิ่มโอกาสปิดการเช่าเร็วขึ้น 2 เท่า ด้วยการยืนยันตัวตนทรัพย์สินให้น่าเชื่อถือที่สุดในตลาด เราทำการตลาดให้คุณบนแพลตฟอร์มที่มีผู้ใช้งานจริงกว่า 100,000 คนต่อเดือน
                </p>
                <ul className="mt-8 space-y-4 sm:mt-6 sm:space-y-3">
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: TEAL }}>✓</span>
                    ติดป้าย Verified สีเขียวเด่นชัด ดึงดูดผู้เช่าเกรด A
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: TEAL }}>✓</span>
                    ดันประกาศให้อยู่ในตำแหน่งที่ดีที่สุดโดยอัตโนมัติ
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: TEAL }}>✓</span>
                    ถ่ายรูปห้องโดยช่างภาพมืออาชีพ ฟรี!
                  </li>
                </ul>
                <Link
                  href="https://assethub.in.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 inline-flex items-center gap-1 text-sm font-medium hover:underline sm:mt-8"
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
              เริ่มจัดการคอนโดและบ้านเช่าได้ฟรี วันนี้
            </p>
            <p className="mt-2 text-slate-300">
              เพิ่มเพื่อนกับ &apos;พอใจ&apos; ใน LINE เพื่อเริ่มต้นใช้งานได้ทันที
            </p>
            <a
              href="https://line.me/ti/p/~@porjai_asset"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#06C755] px-8 py-4 text-lg font-semibold text-white hover:bg-[#05b04c]"
            >
              <Image
                src="/line-icon.png"
                alt="LINE"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 object-contain"
              />
              เพิ่มเพื่อนเพื่อเริ่มฝากห้อง
            </a>
            <p className="mt-6 text-sm text-slate-400">
              หรือค้นหาด้วย ID: <span className="font-mono font-medium text-slate-300">@porjai_asset</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              (กรุณาพิมพ์ @ นำหน้าเมื่อค้นหา)
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
                a: "เจ้าของห้อง (Owner) ใช้งานฟรี 100%! ไม่มีค่าใช้จ่ายแอบแฝง",
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

        {/* Connected Platforms */}
        <motion.section
          className="border-t border-slate-200 bg-slate-50 py-10"
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

        {/* Footer (4 columns) */}
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
                  <a
                    href="https://www.facebook.com/people/Asset-Hub/61586247177169/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-700"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-slate-500 hover:text-slate-700" aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#line-cta" className="text-slate-500 hover:text-slate-700" aria-label="LINE">
                    <Image
                      src="/line-icon.png"
                      alt="LINE"
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">บริการ</h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-1">
                  <li><Link href="#">ฝากเช่าคอนโด</Link></li>
                  <li><Link href="#">ฝากขายคอนโด</Link></li>
                  <li><Link href="#">ค้นหาที่พัก</Link></li>
                  <li><Link href="#">บริการจัดการสินทรัพย์</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">บริษัท</h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-1">
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
                    <span>
                      10th floor, SPE Tower,
                      <br />
                      252 Phahonyothin Rd, Samsen Nai,
                      <br />
                      Phaya Thai, Bangkok 10400
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    02-123-4567
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    porjai.assethub@gmail.com
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
