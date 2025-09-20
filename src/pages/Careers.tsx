import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
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
  School
} from "lucide-react";
import { motion } from "framer-motion";
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
  const [cardHoverStates, setCardHoverStates] = useState<CardHoverState>({});
  
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16">
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
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
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
                  Take our free assessment to discover your ideal SHS strand based on your interests, strengths, and career goals.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/student/login">
                    <Button variant="hero" size="lg" className="group">
                      <Trophy className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Take Free Assessment
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" size="lg" className="group">
                      <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      View My Results
                    </Button>
                  </Link>
                  <Link to="/schools">
                    <Button variant="outline" size="lg" className="group">
                      <School className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      View Schools
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Strand Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedStrand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-muted/20 ${selectedStrand.color}`}>
                    {selectedStrand.icon}
                  </div>
                  <div>
                    <div className="text-2xl">{selectedStrand.strand}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selectedStrand.fullName}</div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedStrand.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* College Programs */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    College Programs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedStrand.collegePrograms.map((program, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{program}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Career Opportunities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    Career Opportunities
                  </h3>
                  <div className="space-y-4">
                    {selectedStrand.careers.map((career, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{career.title}</h4>
                            <Badge variant={getDemandBadgeVariant(career.demand)}>
                              {career.demand} Demand
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{career.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-primary">{career.salary}</span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < (career.demand === "High" ? 5 : career.demand === "Growing" ? 4 : 3)
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-muted"
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Link to="/student/login">
                  <Button variant="hero">
                    <Trophy className="h-4 w-4 mr-2" />
                    Take Assessment
                  </Button>
                </Link>
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