import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex gap-4 p-4 bg-gray-800 text-white">
      <Link href="/">Home</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/flashcards">Flashcards</Link>
      <Link href="/grammar">Grammar</Link>
      <Link href="/reading">Reading</Link>
      <Link href="/listening">Listening</Link>
      <Link href="/exams">Exam</Link>
    </nav>
  );
}