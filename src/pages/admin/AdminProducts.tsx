import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Package, 
  Eye, 
  EyeOff, 
  Shield, 
  Trash2,
  CheckCircle,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CSVImport } from '@/components/admin/CSVImport';

interface Product {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  verified: boolean;
  created_at: string;
  seller_id: string;
  price_min: number | null;
  price_max: number | null;
  images: string[] | null;
  sellerName?: string;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
};

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsData) {
      const enrichedProducts = await Promise.all(
        productsData.map(async (product) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', product.seller_id)
            .single();

          return {
            ...product,
            sellerName: profile?.company_name || 'Unknown Seller'
          };
        })
      );

      setProducts(enrichedProducts);
    }
    
    setLoading(false);
  };

  const togglePublish = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ published: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } else {
      setProducts(products.map(p => 
        p.id === productId ? { ...p, published: !currentStatus } : p
      ));
      toast({ title: currentStatus ? 'Product unpublished' : 'Product published' });
    }
  };

  const toggleVerify = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ verified: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } else {
      setProducts(products.map(p => 
        p.id === productId ? { ...p, verified: !currentStatus } : p
      ));
      toast({ title: currentStatus ? 'Verification removed' : 'Product verified' });
    }
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } else {
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: 'Product deleted' });
    }
  };

  const handleCSVImport = async (data: Record<string, string>[]) => {
    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const productData = {
          title: row.title,
          slug: row.slug || generateSlug(row.title),
          description: row.description || null,
          price_min: row.price_min ? parseFloat(row.price_min) : null,
          price_max: row.price_max ? parseFloat(row.price_max) : null,
          moq: row.moq ? parseInt(row.moq) : 1,
          unit: row.unit || 'piece',
          images: row.images ? row.images.split('|').map(s => s.trim()) : null,
          tags: row.tags ? row.tags.split('|').map(s => s.trim()) : null,
          seller_id: user?.id || '',
          published: row.published?.toLowerCase() === 'true',
          verified: false,
        };

        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message || 'Unknown error'}`);
      }
    }

    if (success > 0) {
      fetchProducts();
    }

    return { success, errors };
  };

  const exportProductsCSV = () => {
    const headers = ['title', 'slug', 'description', 'price_min', 'price_max', 'moq', 'unit', 'published', 'verified', 'seller'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.title.replace(/"/g, '""')}"`,
        p.slug,
        '""',
        p.price_min || '',
        p.price_max || '',
        '',
        '',
        p.published,
        p.verified,
        `"${p.sellerName?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'published' && product.published) ||
      (statusFilter === 'draft' && !product.published) ||
      (statusFilter === 'verified' && product.verified);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Review, verify, and manage all products</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={exportProductsCSV} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCsvImportOpen(true)} className="flex-1 sm:flex-none">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {products.filter(p => p.published).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {products.filter(p => !p.published).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {products.filter(p => p.verified).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'published', 'draft', 'verified'].map((status) => (
                <Button 
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Seller</TableHead>
                    <TableHead className="hidden sm:table-cell">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px]">{product.title}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{product.sellerName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{product.sellerName}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.price_min && product.price_max
                          ? `$${product.price_min} - $${product.price_max}`
                          : 'Not set'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-1">
                          <Badge className={`text-xs ${product.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {product.published ? 'Published' : 'Draft'}
                          </Badge>
                          {product.verified && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(product.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish(product.id, product.published)}
                            title={product.published ? 'Unpublish' : 'Publish'}
                          >
                            {product.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVerify(product.id, product.verified)}
                            title={product.verified ? 'Remove verification' : 'Verify'}
                          >
                            <CheckCircle className={`h-4 w-4 ${product.verified ? 'text-amber-600' : ''}`} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{product.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CSVImport
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        type="products"
        requiredColumns={['title']}
        optionalColumns={['slug', 'description', 'price_min', 'price_max', 'moq', 'unit', 'images', 'tags', 'published']}
        onImport={handleCSVImport}
        sampleData={[
          { title: 'Wireless Bluetooth Headphones', description: 'High quality wireless headphones', price_min: '25', price_max: '45', moq: '50', unit: 'piece', published: 'true' },
          { title: 'LED Desk Lamp', description: 'Modern LED lamp with adjustable brightness', price_min: '15', price_max: '30', moq: '100', unit: 'piece', published: 'false' },
        ]}
      />
    </div>
  );
}
