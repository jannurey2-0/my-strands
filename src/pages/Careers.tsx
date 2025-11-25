import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MaintenancePage } from "@/components/MaintenancePage";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; // Add this import
import { 
  Microscope,
  Calculator,
  Users,
  Palette,
  Wrench,
  Trophy,
  Music,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Eye,
  Star,
  Zap,
  Heart,
  Award,
  School,
  DollarSign,
  BarChart3,
  Sparkles,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { assessmentService } from "@/integrations/supabase/assessmentService";
import strandBackground from "@/assets/strand-background.jpg";

interface CareerPath {
  strand: string;
  fullName: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  collegePrograms: string[];
  careers: Array<{
    title: string;
    description: string;
    salary: string;
    demand: "High" | "Medium" | "Growing";
  }>;
}

// Add this interface for card hover state
interface CardHoverState {
  [key: string]: {
    isHovering: boolean;
    mousePosition: { x: number; y: number };
  };
}

const Careers = () => {
  const [selectedStrand, setSelectedStrand] = useState<CareerPath | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<{name: string, description: string} | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [cardHoverStates, setCardHoverStates] = useState<CardHoverState>({});
  const [maintenance, setMaintenance] = useState<{ isUnderMaintenance: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth(); // Add this line

  // Check maintenance status on component mount
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const status = await assessmentService.isPageUnderMaintenance('careers');
        setMaintenance({
          isUnderMaintenance: status.isUnderMaintenance,
          message: status.maintenanceMessage
        });
      } catch (err) {
        console.error('Error checking maintenance status:', err);
        // Default to not under maintenance if there's an error
        setMaintenance({ isUnderMaintenance: false, message: 'Currently Under Development' });
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  // Program descriptions
  const programDescriptions: Record<string, string> = {
    // STEM Programs
    "Computer Science": "The study of computers and computational systems, including their theoretical and algorithmic foundations, hardware and software, and their applications. Students learn programming, software engineering, artificial intelligence, and cybersecurity.",
    "Engineering": "The application of scientific principles to design and build machines, structures, and systems. Specializations include civil, mechanical, electrical, chemical, and aerospace engineering.",
    "Medicine": "The science and practice of diagnosing, treating, and preventing disease. Medical doctors work to maintain and restore human health through the practice of medicine.",
    "Nursing": "The profession focused on caring for individuals, families, and communities to help them attain, maintain, or recover optimal health and quality of life.",
    "Architecture": "The art and science of designing buildings and structures. Architects create functional, safe, and aesthetically pleasing spaces.",
    "Information Technology": "The use of computers and telecommunications equipment to store, retrieve, transmit, and manipulate data. Focuses on practical applications of computer systems.",
    "Mathematics": "The abstract science of number, quantity, and space. Both pure and applied mathematics are studied in this field.",
    "Physics": "The natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.",
    "Chemistry": "The branch of science that deals with the identification of the substances of which matter is composed and investigates their properties and reactions.",
    "Biology": "The study of living organisms and vital processes. Includes sub-disciplines like molecular biology, ecology, and genetics.",
    
    // ABM Programs
    "Business Administration": "The study of business operations and management. Covers areas like marketing, finance, human resources, and operations management.",
    "Accountancy": "The measurement, processing, and communication of financial information about economic entities.",
    "Economics": "The social science that studies the production, distribution, and consumption of goods and services.",
    "Marketing": "The study of the promotion and selling of products or services, including market research and advertising.",
    "Finance": "The study of money, banking, credit, investments, and assets. Focuses on financial management and decision-making.",
    "Entrepreneurship": "The creation and management of new business ventures. Focuses on innovation, risk-taking, and business development.",
    "Hotel & Restaurant Management": "The study of managing hospitality businesses, including hotels, restaurants, and other food service establishments.",
    "Tourism": "The study of travel and tourism industry operations, including destination management and travel services.",
    "Banking": "The study of financial institutions and services, including loans, deposits, and investment services.",
    
    // HUMSS Programs
    "Psychology": "The scientific study of the mind and behavior. Includes cognitive, social, and developmental psychology.",
    "Education": "The study of teaching methods and learning processes. Prepares students for careers in education.",
    "Political Science": "The study of government systems, political behavior, and public policy.",
    "Communication": "The study of human communication processes, including media studies and public relations.",
    "Social Work": "A profession that helps people function the best they can in their environment and helps improve societal conditions.",
    "History": "The study of past events, particularly in human affairs.",
    "Philosophy": "The study of fundamental questions about existence, knowledge, values, reason, mind, and language.",
    "Literature": "The study of written works, including novels, poetry, and drama, and their cultural significance.",
    "Journalism": "The activity of gathering, assessing, creating, and presenting news and information to the public.",
    "Public Administration": "The implementation of government policy and the academic study of this implementation.",
    
    // GAS Programs
    "Liberal Arts": "A broad-based education covering humanities, social sciences, and natural sciences.",
    "General Studies": "An interdisciplinary program allowing students to explore various fields of study.",
    "Interdisciplinary Studies": "Programs that combine multiple academic disciplines to address complex issues.",
    "Pre-Law": "Preparatory programs for students planning to attend law school.",
    "Mass Communication": "The study of various media forms and their role in society and culture.",
    "International Studies": "The study of global issues, international relations, and cross-cultural understanding.",
    "Development Studies": "The study of economic, political, and social development in various countries.",
    
    // Arts & Design Programs
    "Fine Arts": "The study of visual arts including painting, sculpture, and drawing.",
    "Graphic Design": "The practice of visual communication combining text and graphics to convey messages.",
    "Interior Design": "The art and science of enhancing the interior of buildings for aesthetic and functionality.",
    "Fashion Design": "The art of applying design, aesthetics, and natural beauty to clothing and accessories.",
    "Animation": "The process of creating moving images through sequential drawings or computer-generated imagery.",
    "Multimedia Arts": "The integration of multiple forms of media including text, audio, images, and video.",
    "Industrial Design": "The professional service of creating and developing concepts for products and systems.",
    "Film Production": "The process of creating films, from pre-production to post-production.",
    
    // TVL Programs
    "Technical Education": "Programs focused on practical technical skills for specific industries.",
    "Vocational Education": "Education that prepares people for specific trades, crafts, or careers.",
    "Industrial Education": "The study of industrial processes and technical skills for manufacturing and production.",
    "Maritime Studies": "The study of maritime operations, navigation, and marine engineering.",
    "Aviation Technology": "The study of aircraft maintenance, repair, and aviation systems.",
    "Automotive Technology": "The study of vehicle maintenance, repair, and automotive systems.",
    "Electronics Engineering": "The study of electronic circuits, devices, and systems.",
  };

  const careerPaths: CareerPath[] = [
    {
      strand: "STEM",
      fullName: "Science, Technology, Engineering, Mathematics",
      icon: <Microscope className="h-6 w-6" />,
      color: "text-blue-600",
      description: "STEM graduates are in high demand across industries. From healthcare to technology, engineering to research.",
      collegePrograms: [
        "Computer Science", "Engineering", "Medicine", "Nursing", "Architecture", 
        "Information Technology", "Mathematics", "Physics", "Chemistry", "Biology"
      ],
      careers: [
        {
          title: "Software Engineer",
          description: "Design and develop software applications and systems",
          salary: "₱30,000 - ₱80,000/month",
          demand: "High"
        },
        {
          title: "Medical Doctor",
          description: "Diagnose and treat patients in various medical specialties",
          salary: "₱50,000 - ₱200,000/month",
          demand: "High"
        },
        {
          title: "Data Scientist",
          description: "Analyze complex data to help organizations make decisions",
          salary: "₱40,000 - ₱120,000/month",
          demand: "Growing"
        }
      ]
    },
    {
      strand: "ABM",
      fullName: "Accountancy, Business, Management",
      icon: <Calculator className="h-6 w-6" />,
      color: "text-emerald-600",
      description: "ABM opens doors to business leadership, entrepreneurship, and financial management careers.",
      collegePrograms: [
        "Business Administration", "Accountancy", "Economics", "Marketing", "Finance",
        "Entrepreneurship", "Hotel & Restaurant Management", "Tourism", "Banking"
      ],
      careers: [
        {
          title: "Business Manager",
          description: "Oversee business operations and lead teams to achieve goals",
          salary: "₱35,000 - ₱100,000/month",
          demand: "High"
        },
        {
          title: "Certified Public Accountant",
          description: "Manage financial records and provide accounting services",
          salary: "₱25,000 - ₱80,000/month",
          demand: "High"
        },
        {
          title: "Marketing Manager",
          description: "Develop and execute marketing strategies for products/services",
          salary: "₱30,000 - ₱90,000/month",
          demand: "Medium"
        }
      ]
    },
    {
      strand: "HUMSS",
      fullName: "Humanities and Social Sciences", 
      icon: <Users className="h-6 w-6" />,
      color: "text-purple-600",
      description: "HUMSS graduates contribute to society through education, social work, media, and public service.",
      collegePrograms: [
        "Psychology", "Education", "Political Science", "Communication", "Social Work",
        "History", "Philosophy", "Literature", "Journalism", "Public Administration"
      ],
      careers: [
        {
          title: "Teacher/Professor",
          description: "Educate and inspire students in various academic subjects",
          salary: "₱20,000 - ₱60,000/month",
          demand: "High"
        },
        {
          title: "Psychologist",
          description: "Help people overcome mental health challenges and behavioral issues",
          salary: "₱25,000 - ₱70,000/month",
          demand: "Growing"
        },
        {
          title: "Journalist",
          description: "Research, write, and report news stories for various media outlets",
          salary: "₱20,000 - ₱50,000/month",
          demand: "Medium"
        }
      ]
    },
    {
      strand: "GAS",
      fullName: "General Academic Strand",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "text-orange-600",
      description: "GAS provides flexibility to explore various fields and discover your true passion in college.",
      collegePrograms: [
        "Liberal Arts", "General Studies", "Interdisciplinary Studies", "Pre-Law",
        "Mass Communication", "International Studies", "Development Studies"
      ],
      careers: [
        {
          title: "Public Relations Specialist",
          description: "Manage public image and communications for organizations",
          salary: "₱25,000 - ₱65,000/month",
          demand: "Medium"
        },
        {
          title: "Research Analyst",
          description: "Conduct research and analyze data across various industries",
          salary: "₱22,000 - ₱55,000/month",
          demand: "Growing"
        },
        {
          title: "Government Officer",
          description: "Serve the public through various government agencies and departments",
          salary: "₱20,000 - ₱70,000/month",
          demand: "High"
        }
      ]
    },
    {
      strand: "Arts & Design",
      fullName: "Arts and Design Track",
      icon: <Palette className="h-6 w-6" />,
      color: "text-pink-600",
      description: "Express creativity and bring ideas to life through various artistic and design mediums.",
      collegePrograms: [
        "Fine Arts", "Graphic Design", "Interior Design", "Fashion Design", "Animation",
        "Multimedia Arts", "Industrial Design", "Architecture", "Film Production"
      ],
      careers: [
        {
          title: "Graphic Designer",
          description: "Create visual concepts and designs for digital and print media",
          salary: "₱18,000 - ₱50,000/month",
          demand: "High"
        },
        {
          title: "Animator",
          description: "Create animated content for films, TV, games, and digital media",
          salary: "₱25,000 - ₱70,000/month",
          demand: "Growing"
        },
        {
          title: "Interior Designer",
          description: "Design functional and aesthetically pleasing interior spaces",
          salary: "₱20,000 - ₱80,000/month",
          demand: "Medium"
        }
      ]
    },
    {
      strand: "TVL",
      fullName: "Technical-Vocational-Livelihood",
      icon: <Wrench className="h-6 w-6" />,
      color: "text-amber-600",
      description: "TVL equips students with practical skills for immediate employment or entrepreneurship.",
      collegePrograms: [
        "Technical Education", "Vocational Education", "Industrial Education", "Maritime Studies",
        "Aviation Technology", "Automotive Technology", "Electronics Engineering"
      ],
      careers: [
        {
          title: "Automotive Technician",
          description: "Diagnose and repair vehicles and automotive systems",
          salary: "₱20,000 - ₱50,000/month",
          demand: "High"
        },
        {
          title: "Electronics Technician",
          description: "Install and repair electronic equipment and systems",
          salary: "₱22,000 - ₱55,000/month",
          demand: "Medium"
        },
        {
          title: "Chef/Cook",
          description: "Prepare and cook food in restaurants and other food service establishments",
          salary: "₱18,000 - ₱45,000/month",
          demand: "High"
        }
      ]
    }
  ];

  const handleStrandClick = (strand: CareerPath) => {
    setSelectedStrand(strand);
    setIsModalOpen(true);
  };

  // Handle mouse move for gradient effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, strand: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardHoverStates(prev => ({
      ...prev,
      [strand]: {
        isHovering: true,
        mousePosition: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }
    }));
  };

  // Get badge variant based on demand
  const getDemandBadgeVariant = (demand: string) => {
    switch (demand) {
      case "High": return "default";
      case "Growing": return "secondary";
      default: return "outline";
    }
  };

  // Show maintenance page if under maintenance
  if (maintenance?.isUnderMaintenance) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <MaintenancePage message={maintenance.message} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16 section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Explore Career Paths
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the diverse career opportunities available in each Senior High School strand
            </p>
          </motion.div>

          {/* Strand Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 card-grid"
            >
              {careerPaths.map((path, index) => (
                <motion.div
                  key={path.strand}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="relative"
                  onMouseMove={(e) => handleCardMouseMove(e, path.strand)}
                  onMouseEnter={() => setCardHoverStates(prev => ({
                    ...prev,
                    [path.strand]: {
                      ...(prev[path.strand] || { mousePosition: { x: 0, y: 0 } }),
                      isHovering: true
                    }
                  }))}
                  onMouseLeave={() => setCardHoverStates(prev => ({
                    ...prev,
                    [path.strand]: {
                      ...(prev[path.strand] || { mousePosition: { x: 0, y: 0 } }),
                      isHovering: false
                    }
                  }))}
                >
                  <Card 
                    className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-primary/20 relative overflow-hidden"
                    onClick={() => handleStrandClick(path)}
                  >
                    {/* Gradient background that follows cursor */}
                    {cardHoverStates[path.strand]?.isHovering && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(300px circle at ${cardHoverStates[path.strand]?.mousePosition.x}px ${cardHoverStates[path.strand]?.mousePosition.y}px, 
                            hsl(var(--primary)/0.3), 
                            hsl(var(--secondary)/0.2) 40%, 
                            transparent 70%)`,
                          transition: 'opacity 0.3s ease',
                          zIndex: 0
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10" />
                    <CardHeader className="relative z-20">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg bg-muted/20 ${path.color}`}>
                          {path.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{path.strand}</CardTitle>
                          <CardDescription className="text-sm">{path.fullName}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-20">
                      <p className="text-muted-foreground text-sm mb-4">{path.description}</p>
                      <Button variant="outline" className="w-full group">
                        Explore Careers
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 max-w-3xl mx-auto">
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold mb-4">Not Sure Which Strand is Right for You?</h2>
                <p className="text-muted-foreground mb-6">
                  {user && profile?.role === 'admin' 
                    ? "As an administrator, you can manage the assessment system and view student results." 
                    : "Take our free assessment to discover your ideal SHS strand based on your interests, strengths, and career goals."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user && profile?.role === 'admin' ? (
                    // Show admin-specific buttons
                    <>
                      <Link to="/admin/dashboard">
                        <Button variant="hero" size="lg" className="group">
                          <Trophy className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                          Access Admin Dashboard
                        </Button>
                      </Link>
                      <Link to="/admin/students">
                        <Button variant="outline" size="lg" className="group">
                          <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                          View Student Results
                        </Button>
                      </Link>
                    </>
                  ) : user && profile?.role === 'student' ? (
                    // Show student-specific buttons
                    <>
                      <Link to="/dashboard">
                        <Button variant="hero" size="lg" className="group">
                          <Trophy className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                          Continue to Dashboard
                        </Button>
                      </Link>
                      <Link to="/assessment">
                        <Button variant="outline" size="lg" className="group">
                          <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                          Take Assessment
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // Show default buttons for unauthenticated users
                    <>
                      <Link to="/student/login">
                        <Button variant="hero" size="lg" className="group">
                          <Trophy className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                          Take Free Assessment
                        </Button>
                      </Link>
                      <Link to="/schools">
                        <Button variant="outline" size="lg" className="group">
                          <School className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                          View Schools
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Strand Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] sm:h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
          {selectedStrand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* Header with gradient background */}
              <div className="relative px-6 pt-4 pb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
                <DialogHeader className="relative z-10">
                  <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1">
                    <div className={`p-2 rounded-lg bg-background shadow-sm ${selectedStrand.color}`}>
                      {selectedStrand.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl sm:text-2xl font-bold">{selectedStrand.strand}</div>
                      <div className="text-xs sm:text-sm font-normal text-muted-foreground mt-0.5">{selectedStrand.fullName}</div>
                    </div>
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-2 leading-relaxed">
                    {selectedStrand.description}
                  </DialogDescription>
                </DialogHeader>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <motion.div 
                    className="bg-background/60 backdrop-blur-sm rounded-md p-2 border shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Programs</span>
                    </div>
                    <div className="text-base font-bold">{selectedStrand.collegePrograms.length}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-background/60 backdrop-blur-sm rounded-md p-2 border shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Careers</span>
                    </div>
                    <div className="text-base font-bold">{selectedStrand.careers.length}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-background/60 backdrop-blur-sm rounded-md p-2 border shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <BarChart3 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Demand</span>
                    </div>
                    <div className="text-base font-bold capitalize">
                      {selectedStrand.careers.filter(c => c.demand === "High").length > 0 ? "High" : "Growing"}
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Content with Tabs */}
              <div className="flex-1 overflow-y-auto px-6">
                <Tabs defaultValue="careers" className="w-full pt-6 pb-4">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="careers" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="hidden sm:inline">Career Opportunities</span>
                      <span className="sm:hidden">Careers</span>
                    </TabsTrigger>
                    <TabsTrigger value="programs" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span className="hidden sm:inline">College Programs</span>
                      <span className="sm:hidden">Programs</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="careers" className="space-y-4 mt-0">
                    {selectedStrand.careers.map((career, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                  {career.title}
                                  <Sparkles className="h-4 w-4 text-primary opacity-70" />
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{career.description}</p>
                              </div>
                              <Badge variant={getDemandBadgeVariant(career.demand)} className="shrink-0">
                                {career.demand} Demand
                              </Badge>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 border-t">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Expected Salary</div>
                                  <div className="text-sm font-semibold text-primary">{career.salary}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">Rating:</div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < (career.demand === "High" ? 5 : career.demand === "Growing" ? 4 : 3)
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-300 dark:text-gray-700"
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="programs" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStrand.collegePrograms.map((program, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="group"
                        >
                          <div 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              setSelectedProgram({
                                name: program,
                                description: programDescriptions[program] || 'No description available for this program.'
                              });
                              setIsProgramModalOpen(true);
                            }}
                          >
                            <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium flex-1">{program}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Ready to choose your path?</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            These programs are available across various universities and colleges. Your assessment results will help guide you to the best fit for your interests and strengths.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-muted/30 border-t mt-auto">
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                    Close
                  </Button>
                  {user && profile?.role === 'admin' ? (
                    <Link to="/admin/dashboard" className="w-full sm:w-auto">
                      <Button variant="hero" className="w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        Access Admin Dashboard
                      </Button>
                    </Link>
                  ) : user && profile?.role === 'student' ? (
                    <Link to="/assessment" className="w-full sm:w-auto">
                      <Button variant="hero" className="w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        Take Assessment
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/student/login" className="w-full sm:w-auto">
                      <Button variant="hero" className="w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        Take Assessment
                      </Button>
                    </Link>
                  )}
                </DialogFooter>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Program Detail Modal */}
      <Dialog open={isProgramModalOpen} onOpenChange={setIsProgramModalOpen}>
        <DialogContent className="max-w-md">
          {selectedProgram && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl">{selectedProgram.name}</div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  College Program
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedProgram.description}
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Career Pathways
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This program prepares you for various career opportunities in related fields. 
                    Completing this program can lead to roles in industry, research, or further specialization.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProgramModalOpen(false)}>
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
  );
};

export default Careers;