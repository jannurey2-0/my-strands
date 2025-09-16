import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Link } from "react-router-dom";
import { useState } from "react";
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
  Eye
} from "lucide-react";
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

const Careers = () => {
  const [selectedStrand, setSelectedStrand] = useState<CareerPath | null>(null);
  
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
      description: "TVL provides practical skills and immediate career opportunities in technical and vocational fields.",
      collegePrograms: [
        "Engineering Technology", "Culinary Arts", "Automotive Technology", "Electronics",
        "Information Technology", "Beauty and Wellness", "Agriculture", "Maritime Studies"
      ],
      careers: [
        {
          title: "Chef/Culinary Specialist",
          description: "Prepare and create culinary dishes in restaurants and hotels",
          salary: "₱20,000 - ₱60,000/month",
          demand: "High"
        },
        {
          title: "Automotive Technician",
          description: "Diagnose and repair vehicles and automotive systems",
          salary: "₱18,000 - ₱45,000/month",
          demand: "High"
        },
        {
          title: "Electronics Technician",
          description: "Install, maintain, and repair electronic equipment and systems",
          salary: "₱20,000 - ₱50,000/month",
          demand: "Growing"
        }
      ]
    }
  ];

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "High": return "bg-success text-success-foreground";
      case "Growing": return "bg-primary text-primary-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section 
          className="relative bg-cover bg-center bg-no-repeat py-20"
          style={{ backgroundImage: `url(${strandBackground})` }}
        >
          <div className="absolute inset-0 bg-primary/80" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Explore Your Career Pathways
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Discover the exciting career opportunities that await you in each SHS strand. 
              From STEM to Arts, find your path to a successful future.
            </p>
            <Link to="/assessment">
              <Button variant="hero" size="lg" className="bg-white text-primary hover:bg-white/90">
                <Briefcase className="h-5 w-5 mr-2" />
                Find Your Perfect Strand
              </Button>
            </Link>
          </div>
        </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Career Paths Grid */}
        <div className="space-y-12">
          {careerPaths.map((path, index) => (
            <Card key={path.strand} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${path.color} bg-white p-3 rounded-lg shadow-sm`}>
                      {path.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{path.strand}</CardTitle>
                      <CardDescription className="text-base">{path.fullName}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {path.careers.length} Career Paths
                  </Badge>
                </div>
                <p className="text-foreground mt-4">{path.description}</p>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* College Programs */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                      College Programs
                    </h4>
                    <div className="space-y-2">
                      {path.collegePrograms.slice(0, 6).map((program, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="text-sm text-foreground">{program}</span>
                        </div>
                      ))}
                      {path.collegePrograms.length > 6 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{path.collegePrograms.length - 6} more programs
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Featured Careers */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold mb-4 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      Featured Career Opportunities
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                      {path.careers.map((career, careerIdx) => (
                        <div 
                          key={careerIdx}
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-foreground">{career.title}</h5>
                            <Badge className={getDemandColor(career.demand)} variant="secondary">
                              {career.demand} Demand  
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{career.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-success">
                              {career.salary}
                            </span>
                            <Button variant="ghost" size="sm">
                              Learn More
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Call to Action */}
          <Card className="mt-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Ready to Discover Your Path?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Take our comprehensive assessment to get personalized strand recommendations 
                based on your interests, aptitudes, and career goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/assessment">
                  <Button variant="hero" size="lg">
                    <Microscope className="h-5 w-5 mr-2" />
                    Take Assessment
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg">
                    View Dashboard
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Careers;