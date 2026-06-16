'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const defaultCategories = [
  { slug: 'houseboat', label: 'Houseboats', icon: 'IconHome', sort_order: 1 },
  { slug: 'shikara', label: 'Shikara Rides', icon: 'IconSailboat', sort_order: 2 },
  { slug: 'artisan', label: 'Artisans & Crafts', icon: 'IconPalette', sort_order: 3 },
  { slug: 'guide', label: 'Local Guides', icon: 'IconMapPin', sort_order: 4 },
  { slug: 'vendor', label: 'Floating Vendors', icon: 'IconShoppingBag', sort_order: 5 },
];

export default function AdminCategoriesPage() {
  const [categories] = useState(defaultCategories);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Nadurr" className="w-5 h-5" />
          <h1 className="font-semibold">Categories</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.slug}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-500">Slug: {cat.slug} • Order: {cat.sort_order}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{cat.icon}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
