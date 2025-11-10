import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, School, MapPin, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

type SchoolData = Tables<'schools'>;

export const SchoolsManagement = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [mapPreviewSchool, setMapPreviewSchool] = useState<SchoolData | null>(null);
  const [isMapPreviewOpen, setIsMapPreviewOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    school_id: "",
    category: "",
    strands: [] as string[],
    map_link: "", // Add map_link field
  });

  const [strandInput, setStrandInput] = useState("");

  // Fetch schools from database
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Parse strands JSON
      const parsedData = (data || []).map((school: any) => {
        const strandsArray = Array.isArray(school.strands) 
          ? school.strands.map((s: any) => String(s))
          : [];
        
        return {
          ...school,
          strands: strandsArray as any
        };
      });
      
      setSchools(parsedData as SchoolData[]);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast({
        title: "Error",
        description: "Failed to fetch schools data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStrand = () => {
    if (strandInput.trim() && !formData.strands.includes(strandInput.trim())) {
      setFormData(prev => ({
        ...prev,
        strands: [...prev.strands, strandInput.trim()]
      }));
      setStrandInput("");
    }
  };

  const handleRemoveStrand = (strand: string) => {
    setFormData(prev => ({
      ...prev,
      strands: prev.strands.filter(s => s !== strand)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contact_email: "",
      contact_phone: "",
      school_id: "",
      category: "",
      strands: [] as string[],
      map_link: "",
    });
    setStrandInput("");
    setEditingSchool(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const schoolData = {
        ...formData,
        strands: formData.strands as unknown as Json
      };

      if (editingSchool) {
        // Update existing school
        const { error } = await supabase
          .from('schools')
          .update(schoolData as any)
          .eq('id', editingSchool.id as any);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "School updated successfully"
        });
      } else {
        // Insert new school
        const { error } = await supabase
          .from('schools')
          .insert([schoolData as any]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "School added successfully"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchSchools();
    } catch (error) {
      console.error("Error saving school:", error);
      toast({
        title: "Error",
        description: `Failed to save school: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (school: SchoolData) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address || "",
      contact_email: school.contact_email || "",
      contact_phone: school.contact_phone || "",
      school_id: (school as any).school_id || "",
      category: (school as any).category || "",
      strands: Array.isArray(school.strands) 
        ? school.strands.map(s => String(s)) 
        : [],
      map_link: school.map_link || "", // Add this line
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id as any);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "School deleted successfully"
      });
      
      fetchSchools();
    } catch (error) {
      console.error("Error deleting school:", error);
      toast({
        title: "Error",
        description: `Failed to delete school: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading schools...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schools Management</h2>
          <p className="text-muted-foreground">Manage schools and their available strands</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add New School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? "Edit School" : "Add New School"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="school_id">School ID</Label>
                <Input
                  id="school_id"
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleInputChange}
                  placeholder="Enter school ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select a category</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Strands</Label>
                <div className="flex gap-2">
                  <Input
                    value={strandInput}
                    onChange={(e) => setStrandInput(e.target.value)}
                    placeholder="Enter a strand (e.g. STEM, ABM)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStrand();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddStrand} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.strands.map((strand, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {String(strand)}
                      <button
                        type="button"
                        onClick={() => handleRemoveStrand(strand)}
                        className="ml-2 text-primary hover:text-primary/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Add Map Link Field */}
              <div className="space-y-2">
                <Label htmlFor="map_link">Map Link (Google Maps Embed URL)</Label>
                <Input
                  id="map_link"
                  name="map_link"
                  value={formData.map_link}
                  onChange={handleInputChange}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-muted-foreground">
                  Get the embed URL from Google Maps (Share → Embed a map)
                </p>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchool ? "Update School" : "Add School"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School Name</TableHead>
              <TableHead>School ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Strands</TableHead>
              <TableHead>Map</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{(school as any).school_id || "N/A"}</TableCell>
                <TableCell>{(school as any).category || "N/A"}</TableCell>
                <TableCell>{school.address || "N/A"}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {school.contact_email && (
                      <div className="text-sm">{school.contact_email}</div>
                    )}
                    {school.contact_phone && (
                      <div className="text-sm">{school.contact_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(school.strands) && school.strands.length > 0 ? (
                      school.strands.map((strand, idx) => (
                        <span 
                          key={idx} 
                          className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                        >
                          {String(strand)}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No strands</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {school.map_link ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMapPreviewSchool(school);
                        setIsMapPreviewOpen(true);
                      }}
                      title="Preview map"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No map</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(school)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(school.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {schools.length === 0 && (
          <div className="text-center py-12">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-4">Add your first school to get started</p>
          </div>
        )}
      </div>

      {/* Map Preview Dialog */}
      <Dialog open={isMapPreviewOpen} onOpenChange={setIsMapPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Map Preview: {mapPreviewSchool?.name}
            </DialogTitle>
            <DialogDescription>
              Location of {mapPreviewSchool?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[60vh] w-full">
            {mapPreviewSchool?.map_link ? (
              <iframe 
                src={mapPreviewSchool.map_link}
                className="w-full h-full border-0 rounded-lg"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${mapPreviewSchool.name}`}
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No map available for this school</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMapPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};