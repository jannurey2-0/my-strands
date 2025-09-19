import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useState, useEffect, useMemo } from "react";
import { 
  MapPin,
  Phone,
  Mail,
  Globe,
  School,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { assessmentService } from "@/integrations/supabase/assessmentService";
import { Tables } from "@/integrations/supabase/types";
import ErrorBoundary from "@/components/ErrorBoundary";

interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  strands: string[]; // JSON array of strands
  created_at: string;
  updated_at: string;
}

const Schools = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStrands, setSelectedStrands] = useState<string[]>([]);
  
  // Get all unique strands for filter options
  const allStrands = useMemo(() => {
    const strandsSet = new Set<string>();
    schools.forEach(school => {
      if (Array.isArray(school.strands)) {
        school.strands.forEach(strand => strandsSet.add(strand));
      }
    });
    return Array.from(strandsSet).sort();
  }, [schools]);

  // Fetch schools data
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const data = await assessmentService.getAllSchools();
        // Type cast the data to our SchoolData interface and parse JSON strands
        const parsedData = data.map((school: any) => ({
          ...school,
          strands: typeof school.strands === 'string' 
            ? JSON.parse(school.strands) 
            : Array.isArray(school.strands) 
            ? school.strands 
            : []
        }));
        setSchools(parsedData as SchoolData[]);
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError("Failed to load schools. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleSchoolClick = (school: SchoolData) => {
    setSelectedSchool(school);
    setIsModalOpen(true);
  };

  const getStrandColor = (strand: string) => {
    const colors: Record<string, string> = {
      "STEM": "bg-blue-100 text-blue-800",
      "ABM": "bg-emerald-100 text-emerald-800",
      "HUMSS": "bg-purple-100 text-purple-800",
      "GAS": "bg-orange-100 text-orange-800",
      "TVL": "bg-amber-100 text-amber-800"
    };
    return colors[strand] || "bg-gray-100 text-gray-800";
  };

  // Filter schools based on search term and selected strands
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      // Filter by search term (name or address)
      const matchesSearch = 
        !searchTerm || 
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by selected strands
      const matchesStrands = 
        selectedStrands.length === 0 || 
        (Array.isArray(school.strands) && 
         selectedStrands.some(strand => school.strands.includes(strand)));
      
      return matchesSearch && matchesStrands;
    });
  }, [schools, searchTerm, selectedStrands]);

  // Toggle strand filter
  const toggleStrandFilter = (strand: string) => {
    setSelectedStrands(prev => 
      prev.includes(strand) 
        ? prev.filter(s => s !== strand) 
        : [...prev, strand]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStrands([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || selectedStrands.length > 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Find Your Ideal School
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore Senior High Schools in your area and discover which ones offer the strands that match your interests
              </p>
            </motion.div>

            {/* Search and Filter Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-background to-muted/30 border-primary/10">
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      placeholder="Search schools by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-6 text-lg"
                    />
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Filter className="h-5 w-5 text-primary" />
                      <span className="font-medium">Filter by strand:</span>
                      {allStrands.map(strand => (
                        <Button
                          key={strand}
                          variant={selectedStrands.includes(strand) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleStrandFilter(strand)}
                          className={selectedStrands.includes(strand) ? "bg-primary hover:bg-primary/90" : ""}
                        >
                          {strand}
                        </Button>
                      ))}
                    </div>
                    
                    {hasActiveFilters && (
                      <Button 
                        variant="ghost" 
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                        Clear filters
                      </Button>
                    )}
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {searchTerm && (
                        <Badge variant="secondary" className="flex items-center gap-1 py-1 px-3 text-sm">
                          <Search className="h-3 w-3" />
                          {searchTerm}
                          <button 
                            onClick={() => setSearchTerm("")}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {selectedStrands.map(strand => (
                        <Badge 
                          key={strand} 
                          variant="secondary" 
                          className="flex items-center gap-1 py-1 px-3 text-sm"
                        >
                          {strand}
                          <button 
                            onClick={() => toggleStrandFilter(strand)}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">
                        {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {error && (
              <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-muted-foreground">Loading schools...</div>
              </div>
            ) : (
              <>
                {/* Schools Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {filteredSchools.length === 0 ? (
                    <div className="text-center py-12">
                      <School className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No schools found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filter criteria
                      </p>
                      <Button onClick={clearFilters} variant="outline">
                        Clear all filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {filteredSchools.map((school, index) => (
                        <motion.div
                          key={school.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card 
                            className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-primary/10"
                            onClick={() => handleSchoolClick(school)}
                          >
                            <CardHeader>
                              <div className="flex items-center space-x-3">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                  <School className="h-6 w-6" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{school.name}</CardTitle>
                                  <CardDescription className="text-sm flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {school.address || "Address not available"}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center">
                                    <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                                    Offered Strands
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.isArray(school.strands) ? (
                                      school.strands.map((strand, idx) => (
                                        <Badge 
                                          key={idx} 
                                          className={getStrandColor(strand)}
                                        >
                                          {strand}
                                        </Badge>
                                      ))
                                    ) : (
                                      <Badge variant="secondary">No strands listed</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button variant="outline" className="w-full group">
                                  View Details
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* CTA Section */}
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 max-w-3xl mx-auto">
                    <CardContent className="py-8">
                      <h2 className="text-2xl font-bold mb-4">Not Sure Which School is Right for You?</h2>
                      <p className="text-muted-foreground mb-6">
                        Take our free assessment to discover your ideal SHS strand, then find schools that offer strong programs in your chosen field.
                      </p>
                      <Button variant="hero" size="lg" className="group">
                        <GraduationCap className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                        Take Free Assessment
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>
        </main>

        {/* School Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
            {selectedSchool && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-t-lg border-b">
                  <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md">
                      <School className="h-8 w-8" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-foreground">{selectedSchool.name}</div>
                      <div className="text-sm font-normal text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedSchool.address || "Address not available"}
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 p-6">
                  {/* Contact Information */}
                  <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                      <Phone className="h-5 w-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedSchool.contact_email || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedSchool.contact_phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Offered Strands */}
                  <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Offered Strands
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {Array.isArray(selectedSchool.strands) && selectedSchool.strands.length > 0 ? (
                        selectedSchool.strands.map((strand, idx) => (
                          <Badge 
                            key={idx} 
                            className={`${getStrandColor(strand)} py-2 px-4 text-base font-medium hover:shadow-md transition-shadow duration-200`}
                          >
                            {strand}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic">No strands information available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Location Map Placeholder */}
                  <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                      <MapPin className="h-5 w-5 mr-2" />
                      Location
                    </h3>
                    <div className="bg-muted/20 rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-muted">
                      <div className="text-center p-6">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2 font-medium">
                          Interactive Map
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Google Maps integration would appear here in a production environment to show the school's location and provide directions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Website */}
                  <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                      <Globe className="h-5 w-5 mr-2" />
                      Website
                    </h3>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Official Website</p>
                        <p className="font-medium text-primary hover:underline cursor-pointer">Visit School Website</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="px-6 py-4 bg-muted/10 rounded-b-lg">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="hover:shadow-md transition-shadow"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

export default Schools;