'use client';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-600 rounded-lg" />
        <h1 className="text-xl font-bold text-gray-900">Belarro</h1>
      </div>
      <div className="text-sm text-gray-600">Farm Management System</div>
    </nav>
  );
}
