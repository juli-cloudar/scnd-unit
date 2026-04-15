import re

# Lese Datei
with open('src/app/admin/page.tsx', 'r') as f:
    content = f.read()

# 1. Füge Import hinzu
if 'useConfirm' not in content:
    content = content.replace(
        "import { supabase } from '@/lib/supabase';",
        "import { supabase } from '@/lib/supabase';\nimport { useConfirm } from '@/components/ConfirmDialog';"
    )

# 2. Füge Hook hinzu
if 'const confirm = useConfirm()' not in content:
    content = content.replace(
        'const [successMsg, setSuccessMsg] = useState(\'\');',
        'const [successMsg, setSuccessMsg] = useState(\'\');\n  const confirm = useConfirm();'
    )

# 3. Ersetze removeProduct
old_remove = '''  const removeProduct = async (id: number) => {
    if (!confirm('Produkt wirklich löschen?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { setProducts(p => p.filter(x => x.id !== id)); showSuccess('Produkt gelöscht!'); }
  };'''

new_remove = '''  const removeProduct = async (id: number) => {
    const confirmed = await confirm({
      title: 'Produkt löschen',
      message: 'Möchtest du dieses Produkt wirklich unwiderruflich löschen?',
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      type: 'danger',
    });
    if (!confirmed) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { setProducts(p => p.filter(x => x.id !== id)); showSuccess('Produkt gelöscht!'); }
  };'''

content = content.replace(old_remove, new_remove)

# Speichere
with open('src/app/admin/page.tsx', 'w') as f:
    f.write(content)

print('Admin-Page aktualisiert!')
