import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Award,
  Microscope,
  Calculator,
  BookOpen,
  Palette,
  Wrench,
  Trophy,
  Mail,
  Phone,
  MapPin,
  User,
  School,
  Target
} from "lucide-react";
import heroStudents from "@/assets/hero-students.jpg";

const Index = () => {
  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      title: "Personalized Assessment",
      description: "Answer questions about your interests, aptitudes, and goals to get tailored recommendations."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Smart Analysis",
      description: "Our system analyzes your responses using proven educational frameworks and career mapping."
    },
    {
      icon: <Award className="h-6 w-6 text-warning" />,
      title: "Detailed Results",
      description: "Get comprehensive reports with match percentages and career pathway information."
    }
  ];

  const strands = [
    { name: "STEM", icon: <Microscope className="h-5 w-5" />, color: "text-blue-600", description: "Science, Technology, Engineering, Math" },
    { name: "ABM", icon: <Calculator className="h-5 w-5" />, color: "text-emerald-600", description: "Accountancy, Business, Management" },
    { name: "HUMSS", icon: <Users className="h-5 w-5" />, color: "text-purple-600", description: "Humanities & Social Sciences" }, 
    { name: "GAS", icon: <BookOpen className="h-5 w-5" />, color: "text-orange-600", description: "General Academic Strand" },
    { name: "Arts", icon: <Palette className="h-5 w-5" />, color: "text-pink-600", description: "Arts & Design Track" },
    { name: "TVL", icon: <Wrench className="h-5 w-5" />, color: "text-amber-600", description: "Technical-Vocational-Livelihood" }
  ];

  const teamMembers = [
    {
      name: "Dr. Maria Santos",
      role: "Chief Academic Officer",
      bio: "20+ years in educational psychology and student assessment",
      icon: <User className="h-8 w-8" />
    },
    {
      name: "Prof. Juan Dela Cruz",
      role: "Career Guidance Specialist",
      bio: "Expert in SHS strand selection and career pathways",
      icon: <Target className="h-8 w-8" />
    },
    {
      name: "Ms. Ana Reyes",
      role: "Technology Director",
      bio: "Specializes in educational technology and student engagement",
      icon: <School className="h-8 w-8" />
    }
  ];

  // Handle scrolling to sections when the page loads with a hash
  useEffect(() => {
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.substring(1));
      if (element) {
        // Small delay to ensure the page has fully loaded
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🎓 Are you ready?
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  FIND THE PERFECT 
                  <span className="text-primary"> SHS STRAND </span>
                  THAT FITS YOU BEST
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Discover which Senior High School Strand is best suited for you based on your interests, strengths, and  future goals.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/student/login">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Start Assessment
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/careers">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Career Paths
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Free Assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Career Guidance</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroStudents} 
                  alt="Students exploring their future careers" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">85% Match</div>
                    <div className="text-xs text-muted-foreground">STEM</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-float delay-500">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-sm font-semibold">10K+</div>
                    <div className="text-xs text-muted-foreground">Students Helped</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How SHSNavigator Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our scientifically-backed assessment process helps you discover your ideal SHS strand in just three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SHS Strands Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Explore All SHS Strands
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn about the different Senior High School strands and discover which one aligns with your interests and career goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strands.map((strand, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`${strand.color} bg-muted/20 p-2 rounded-lg`}>
                      {strand.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{strand.name}</CardTitle>
                      <CardDescription className="text-sm">{strand.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/careers">
              <Button variant="outline" size="lg">
                View Detailed Career Paths
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              About SHSNavigator
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering students to make informed decisions about their educational future
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6">Our Mission</h3>
              <p className="text-muted-foreground mb-4">
                SHSNavigator was founded with the mission to help Grade 10 students in the Philippines 
                make informed decisions about their Senior High School strand selection. We believe that 
                every student deserves guidance to discover their potential and align their education 
                with their interests and career aspirations.
              </p>
              <p className="text-muted-foreground mb-4">
                Our team of educational experts, career counselors, and technology professionals have 
                developed a scientifically-backed assessment system that provides personalized 
                recommendations to help students navigate this critical educational decision.
              </p>
              <p className="text-muted-foreground">
                Since our launch, we've helped over 10,000 students find their ideal SHS strand, 
                setting them on a path toward academic success and fulfilling careers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                <div className="text-muted-foreground">Students Helped</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">6</div>
                <div className="text-muted-foreground">SHS Strands</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">98%</div>
                <div className="text-muted-foreground">Satisfaction Rate</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </Card>
            </div>
          </div>
          
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-8">Our Team</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                    {member.icon}
                  </div>
                  <CardTitle className="text-lg mb-2">{member.name}</CardTitle>
                  <CardDescription className="mb-3">{member.role}</CardDescription>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions or need assistance? Get in touch with our team
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
              <p className="text-muted-foreground mb-8">
                Our support team is here to help you with any questions about our service, 
                the assessment process, or your SHS strand recommendations.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Our Office</h4>
                    <p className="text-muted-foreground">
                      123 Education Street, Manila, Philippines
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <p className="text-muted-foreground">
                      +63 123 456 7890
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Mon-Fri, 8:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className="text-muted-foreground">
                      info@shsnavigator.edu.ph
                    </p>
                    <p className="text-muted-foreground text-sm">
                      We'll respond within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="Your first name"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="Your last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="What is this regarding?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Your message here..."
                      ></textarea>
                    </div>
                    
                    <Button variant="hero" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Find Your Perfect SHS Strand?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who have discovered their ideal academic path with SHSNavigator. Start your journey today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/student/login">
              <Button variant="hero" size="lg">
                <Trophy className="h-5 w-5 mr-2" />
                Take Free Assessment
              </Button>
            </Link>
            <Link to="/student/login">
              <Button variant="outline" size="lg">
                Create Student Account
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            ✨ No registration required to start • Get instant results • Completely free
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;