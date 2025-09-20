import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useToast } from "@/hooks/use-toast";
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
  Target,
  Star,
  Zap,
  Heart
} from "lucide-react";
import heroStudents from "@/assets/hero-students.jpg";
import { motion } from "framer-motion";

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-success" />,
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
    { name: "STEM", icon: <Microscope className="h-5 w-5" />, color: "text-blue-600", description: "Science, Technology, Engineering, Math", bgColor: "bg-blue-50" },
    { name: "ABM", icon: <Calculator className="h-5 w-5" />, color: "text-emerald-600", description: "Accountancy, Business, Management", bgColor: "bg-emerald-50" },
    { name: "HUMSS", icon: <Users className="h-5 w-5" />, color: "text-purple-600", description: "Humanities & Social Sciences", bgColor: "bg-purple-50" }, 
    { name: "GAS", icon: <BookOpen className="h-5 w-5" />, color: "text-orange-600", description: "General Academic Strand", bgColor: "bg-orange-50" },
    { name: "Arts", icon: <Palette className="h-5 w-5" />, color: "text-pink-600", description: "Arts & Design Track", bgColor: "bg-pink-50" },
    { name: "TVL", icon: <Wrench className="h-5 w-5" />, color: "text-amber-600", description: "Technical-Vocational-Livelihood", bgColor: "bg-amber-50" }
  ];

  const teamMembers = [
    {
      name: "Ms. Lucilyn Perez Enriquez",
      role: "Chief Academic Officer",
      bio: "20+ years in educational psychology and student assessment",
      icon: <User className="h-8 w-8" />
    },
    {
      name: "Ms. Carlyn Mae Ursal Dugmoc",
      role: "Career Guidance Specialist",
      bio: "Expert in SHS strand selection and career pathways",
      icon: <User className="h-8 w-8" />
    },
    {
      name: "Ms. Charlene Fuentes",
      role: "Technology Director",
      bio: "Specializes in educational technology and student engagement",
      icon: <User className="h-8 w-8" />
    },
    {
      name: "Ms. Gen Arcadio",
      role: "Technology Director",
      bio: "Specializes in educational technology and student engagement",
      icon: <User className="h-8 w-8" />
    },
    {
      name: "Ms. Stella Paredes",
      role: "Technology Director",
      bio: "Specializes in educational technology and student engagement",
      icon: <User className="h-8 w-8" />
    },
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

  // Show sign out success toast when the parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signout') === 'success') {
      const { id, dismiss } = toast({
        title: "Signed out successfully",
        description: "You have been successfully signed out.",
      });
      
      // Automatically dismiss the toast after 3 seconds
      setTimeout(() => {
        dismiss();
      }, 3000);
      
      // Remove the parameter from the URL without reloading the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('signout');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [location, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 flex-grow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Badge variant="secondary" className="w-fit px-4 py-2 text-sm">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    🎓 Are you ready?
                  </Badge>
                </motion.div>
                <motion.h1 
                  className="text-4xl lg:text-6xl font-bold text-foreground leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  FIND THE PERFECT 
                  <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> SHS STRAND </span>
                  THAT FITS YOU BEST
                </motion.h1>
                <motion.p 
                  className="text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Discover which Senior High School Strand is best suited for you based on your interests, strengths, and  future goals.
                </motion.p>
              </div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link to="/student/login">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-semibold group">
                    Start Assessment
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/careers">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-semibold">
                    Explore Career Paths
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                className="flex items-center space-x-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Free Assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Career Guidance</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroStudents} 
                  alt="Students exploring their future careers" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              </div>
              
              {/* Floating Cards */}
              <motion.div 
                className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float md:-top-4 md:-left-4 lg:-top-4 lg:-left-4 hidden sm:block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">85% Match</div>
                    <div className="text-xs text-muted-foreground">STEM</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-float delay-500 md:-bottom-4 md:-right-4 lg:-bottom-4 lg:-right-4 hidden sm:block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-sm font-semibold">10K+</div>
                    <div className="text-xs text-muted-foreground">Students Helped</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How SHSNavigator Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our scientifically-backed assessment process helps you discover your ideal SHS strand in just three simple steps.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full border-primary/10">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SHS Strands Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Explore All SHS Strands
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn about the different Senior High School strands and discover which one aligns with your interests and career goals.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strands.map((strand, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${strand.bgColor} border-0`}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`${strand.color} ${strand.bgColor.replace('50', '100')} p-3 rounded-lg`}>
                        {strand.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{strand.name}</CardTitle>
                        <CardDescription className="text-sm">{strand.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/careers">
              <Button variant="outline" size="lg" className="px-8 py-6 text-base font-semibold group">
                View Detailed Career Paths
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              About SHSNavigator
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering students to make informed decisions about their educational future
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
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
            </motion.div>
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                <div className="text-muted-foreground">Students Helped</div>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-secondary mb-2">6</div>
                <div className="text-muted-foreground">SHS Strands</div>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-success mb-2">98%</div>
                <div className="text-muted-foreground">Satisfaction Rate</div>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-warning mb-2">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </Card>
            </motion.div>
          </div>
          
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold mb-8">Our Team</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-primary/10">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                      {member.icon}
                    </div>
                    <CardTitle className="text-lg mb-2">{member.name}</CardTitle>
                    <CardDescription className="mb-3">{member.role}</CardDescription>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions or need assistance? Get in touch with our team
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
              <p className="text-muted-foreground mb-8">
                Our support team is here to help you with any questions about our service, 
                the assessment process, or your SHS strand recommendations.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center text-primary">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center text-primary">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center text-primary">
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
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-primary/10">
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
                          className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                          className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                        className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                        className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                        className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="Your message here..."
                      ></textarea>
                    </div>
                    
                    <Button variant="hero" className="w-full py-3 text-base font-semibold">
                      Send Message
                      <Heart className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Ready to Find Your Perfect SHS Strand?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students who have discovered their ideal academic path with SHSNavigator. Start your journey today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/student/login">
                <Button variant="hero" size="lg" className="px-8 py-6 text-base font-semibold group">
                  <Trophy className="h-5 w-5 mr-2" />
                  Take Free Assessment
                </Button>
              </Link>
              <Link to="/student/login">
                <Button variant="outline" size="lg" className="px-8 py-6 text-base font-semibold">
                  Create Student Account
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 text-sm text-muted-foreground flex items-center justify-center">
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />
              ✨ No registration required to start • Get instant results • Completely free
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;