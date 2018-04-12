var express    = require("express");
var mysql      = require('mysql');
var email   = require("emailjs/email");
var htmlToPdf = require('html-to-pdf');
var fs = require('fs');
var AWS = require('aws-sdk');
var FCM = require('fcm-node');
var connection = mysql.createConnection({  
  // host:"smis.cpldg3whrhyv.ap-south-1.rds.amazonaws.com",
  // database:"scorecarddb",
  // port:'3306',
  // user:"smis",
  // password:"smispass",
  // reconnect:true,
  // data_source_provider:"rds",
  // type:"mysql"   

  host     : 'localhost',
  user     : 'root',
  password : 'admin',
  database : 'samsidhreportcard'
 });

var bodyParser = require('body-parser'); 
var app = express();
var logfile;
AWS.config.loadFromPath('app/configfile/credential.json');

app.use(express.static('app'));
var urlencodedParser = bodyParser.urlencoded({ extended: false })
  app.get('/', function (req, res){
  res.sendFile("app/index.html" );
})
app.post('/smis-fetchvisitortype',  urlencodedParser,function (req, res)
{
  var arr=[];
    connection.query("SELECT * FROM visitor_type",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      var obj={"name":"-----Select-----","id":"select"};
      arr.push(obj);
      for(var i=0;i<rows.length;i++){
        arr.push(rows[i]);
      }
      res.status(200).json(arr);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchvisitingtype',  urlencodedParser,function (req, res)
{
  var arr=[];
    connection.query("SELECT * FROM visiting_type",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // res.status(200).json(rows);
      var obj={"name":"-----Select-----","id":"select"};
      arr.push(obj);
      for(var i=0;i<rows.length;i++){
        arr.push(rows[i]);
      }
      res.status(200).json(arr);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchvisitingstudent',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_student s JOIN md_class_section c on(s.class_id=c.id) WHERE s.school_id='"+req.body.school_id+"' and s.academic_year='"+req.body.academic_year+"' and c.school_id='"+req.body.school_id+"' and c.academic_year='"+req.body.academic_year+"' and  flag='active'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchvisitingstaff',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_employee_creation WHERE school_id='"+req.body.school_id+"'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchcheckoutlist',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM visitor_master WHERE school_id='"+req.body.school_id+"' and DATE(in_time)=STR_TO_DATE( '"+req.body.currdate+"',  '%d/%m/%Y' ) and status='0'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-updatecheckoutinfo',  urlencodedParser,function (req, res)
{
  var q="UPDATE visitor_master SET out_time=CURRENT_TIMESTAMP,status='1' WHERE school_id='"+req.body.school_id+"' and visitor_id='"+req.body.visitorid+"'";

    connection.query("UPDATE visitor_master SET out_time=CURRENT_TIMESTAMP,status='1' WHERE school_id='"+req.body.school_id+"' and visitor_id='"+req.body.visitorid+"'",
    function(err, result)
    {
    if(!err)
    {
    if(result.affectedRows>0)
    {
      res.status(200).json({'returnval':'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval':'Not updated'+err+q});
    }
    }
    else
      console.log(err);
});
});


app.post('/smis-savecheckininfo',  urlencodedParser,function (req, res)
{
   var response={
    school_id:req.body.schoolid,
    academic_year:req.body.academicyear,
    visitor_id:'',
    visitor_name:req.body.visitorname,
    email:req.body.email,
    mobile_no:req.body.mobileno,
    address:req.body.address,
    visitor_type:req.body.visitortype,
    visiting_type:req.body.visitingtype,
    other_visitor_type:req.body.othervisitortype,
    other_visiting_type:req.body.othervisitingtype,
    visiting_name:req.body.visitingname,
    purpose:req.body.purpose,
    employee_name:req.body.empname,
    status:'0'
  };
    connection.query("SELECT * FROM visitor_sequence WHERE school_id='"+req.body.schoolid+"'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      var seq=rows[0].visitor_seq;
      var newseq=parseInt(seq)+1;
      response.visitor_id="VSTR#"+seq;
      connection.query("INSERT INTO visitor_master SET ?",[response],function(err, rows)
      {
      if(!err)
      {
      connection.query("UPDATE visitor_sequence SET visitor_seq='"+newseq+"' WHERE school_id='"+req.body.schoolid+"'",function(err, rows){
      if(!err)
      res.status(200).json({'returnval':'Updated'});
      });
      }
      }); 
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval':'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/lprolecheck-service',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_employee WHERE id='"+req.body.emp_id+"' AND school_id='"+req.body.school_id+"' and academic_year='"+req.body.academic_year+"' and flage='active' and role_id in('subject-teacher')",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': 'valid'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/lessonplan-login',  urlencodedParser,function (req, res)
{
    var qurcheck= "select school_id,emp_id,emp_name from md_employee_creation  where emp_id='"+req.body.empid+"' "+
    " and emp_mobile='"+req.body.mobno+"' and flage='active' and academic_year='2017-2018' ";
    var que = "SELECT * from lessonplan_users WHERE mobile_no ='"+req.body.mobno+"' ";
    var data={
      id: req.body.empid,
      mobile_no: req.body.mobno,
      reg_id: req.body.reg_id
    };
    var schoolid;
    var empname;
    var checkquery = connection.query(qurcheck, function(err, rows)
    {
    if(!err){
    if(rows.length>0){
    schoolid=rows[0].school_id;
    empname=rows[0].emp_name;
    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          if(rows.length == 0){
          var query = connection.query("INSERT INTO lessonplan_users set ? ",data, function(err, rows)
          {
          if(!err)
          res.status(200).json({'response':"Sucessfully Registered!",'schoolid':schoolid,'empname':empname});
          else
          res.status(200).json({'response':"Unable to Register!"});
          });
          }
          else {
          res.status(200).json({'response':"User already Registered!",'schoolid':schoolid,'empname':empname});
          }  
          }
          else
          res.status(200).json({'response':"Error!"+err});

    });   
    }
    else{
      res.status(200).json({'response':"Please register before login!"});
    }
    }
    else
    {
        res.status(200).json({'response':"Error!"+err});      
    }
    });
});

app.post('/smis-getpendingactivities',  urlencodedParser,function (req, res)
{  
  var que="SELECT * FROM mp_teacher_grade g JOIN md_curriculum_planning p ON "+
" ( g.grade_id = p.grade_id ) WHERE g.school_id =  '"+req.body.schoolid+"' AND g.id =  '"+req.body.empid+"' "+
" AND g.academic_year =  '2017-2018' AND g.flage =  'active' AND g.role_id =  'subject-teacher' "+
" AND p.school_id =  '"+req.body.schoolid+"' AND p.academic_year =  '2017-2018' AND "+
" ((STR_TO_DATE( p.planned_date_from,  '%m/%d/%Y' ) <= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' )) "+
" OR (STR_TO_DATE( p.planned_to_date,  '%m/%d/%Y' ) >= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' ))) "+
" AND g.section_id IN (SELECT DISTINCT(section_id) FROM mp_teacher_grade "+
" WHERE school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' AND role_id =  'subject-teacher' "+
" AND id =  '"+req.body.empid+"') AND p.subject_id IN (SELECT DISTINCT(subject_id) "+
" FROM mp_teacher_grade WHERE school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' "+
" AND role_id =  'subject-teacher' AND id =  '"+req.body.empid+"') ";
console.log(que);
// console.log(approval);
var mapping=[];
var approved=[];
var response=[];
    connection.query(que, function(err, rows)
    {
          if(!err){
          if(rows.length>0){
          mapping=rows;
          // var approval="select * from md_curriculum_planning_approval "+
          // " where school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' and emp_id='"+req.body.empid+"'  ";

          connection.query("select * from md_curriculum_planning_approval where school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' and emp_id='"+req.body.empid+"'", function(err, rows)
          {
          if(!err){
            if(rows.length>0){
              approved=rows;
              for(var i=0;i<mapping.length;i++){
                var flag=0;
                for(var j=0;j<approved.length;j++){
                  if(mapping[i].grade_id==approved[j].grade_id&&mapping[i].section_id==approved[j].section_id&&
                    mapping[i].subject_id==approved[j].subject_id&&mapping[i].concept_id==approved[j].concept_id&&
                    mapping[i].sub_concept_id==approved[j].sub_concept_id){
                    flag=1;
                    mapping.splice(i,1);
                    i--;
                    break;
                  }
                }
                if(flag==0)
                {
                  if(response.length==0)
                    response.push({"grade_name":mapping[i].grade_name,"section_id":mapping[i].section_id,"subject_name":mapping[i].subject_name});
                  var f=0;
                  for(var x=0;x<response.length;x++){
                    if(response[x].grade_name==mapping[i].grade_name&&response[x].section_id==mapping[i].section_id&&response[x].subject_name==mapping[i].subject_name)
                    {
                      f=1;
                    }
                  }
                  if(f==0)
                  response.push({"grade_name":mapping[i].grade_name,"section_id":mapping[i].section_id,"subject_name":mapping[i].subject_name});
                }
              }
              res.status(200).json(response);
            }
            else{
                  if(response.length==0)
                    response.push({"grade_name":mapping[i].grade_name,"section_id":mapping[i].section_id,"subject_name":mapping[i].subject_name});
                  
                  for(var i=0;i<mapping.length;i++){
                    var f=0;
                  for(var x=0;x<response.length;x++){
                    if(response[x].grade_name==mapping[i].grade_name&&response[x].section_id==mapping[i].section_id&&response[x].subject_name==mapping[i].subject_name)
                    {
                      f=1;
                    }
                  }
                  if(f==0)
                  response.push({"grade_name":mapping[i].grade_name,"section_id":mapping[i].section_id,"subject_name":mapping[i].subject_name});
                  }
                  res.status(200).json(response);
            }
          
          }
          else{
            console.log(err);
          res.status(200).json([{'error':'Error!'+err}]);
        }
          }); 
          }   
          else{
            console.log('no row');
           res.status(200).json([{'error':'Error!'+que}]);   
          }
        }
          else{
            console.log(err);
          res.status(200).json([{'error':'Error!'+err}]);
        }

    });  
  }); 


app.post('/getactivitiesfornotification',  urlencodedParser,function (req, res)
{
    var que = "SELECT * FROM mp_teacher_grade g join md_curriculum_planning p on(g.grade_id=p.grade_id) WHERE "+
    " g.school_id='"+req.body.schoolid+"' and g.id='"+req.body.empid+"' and g.academic_year='2017-2018' and g.flage='active' and "+
    " g.role_id='co-ordinator' and p.school_id='"+req.body.schoolid+"' and p.academic_year='2017-2018'";

    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          if(rows.length > 0){
          res.status(200).json(rows);
          }
          else{
          res.status(200).json('no rows!');
          }
          }
          else
          res.status(200).json('Error!');
    });   
});

app.post('/fetchactivityfornotify',  urlencodedParser,function (req, res)
{
    var que = "select distinct(id),emp_mobile from md_curriculum_planning p join mp_teacher_grade g on(p.grade_id=g.grade_id) join md_employee_creation c on(g.id=c.emp_id) where  p.school_id='"+req.body.schoolid+"' and p.academic_year='2017-2018' and g.school_id='"+req.body.schoolid+"' and g.academic_year='2017-2018' and c.school_id='"+req.body.schoolid+"' and c.academic_year='2017-2018' and "+
    " emp_mobile!='' and ((STR_TO_DATE(p.planned_date_from,'%m/%d/%Y')<=STR_TO_DATE('"+req.body.currdate+"','%d/%m/%Y'))  or (STR_TO_DATE(p.planned_to_date,'%m/%d/%Y')>=STR_TO_DATE('"+req.body.currdate+"','%d/%m/%Y')))";
    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          if(rows.length > 0){
          res.status(200).json(rows);
          }
          else{
          res.status(200).json('no rows!');
          }
          }
          else
          res.status(200).json('Error!');
    });   
});

app.post('/lessonplanchapters',  urlencodedParser,function (req, res)
{
  var que = "select distinct(chapter_id),chapter_name,row_id from md_curriculum_planning where school_id='"+req.body.schoolid+"' and "+
  " academic_year='2017-2018' and grade_name='"+req.body.grade+"' and subject_name='"+req.body.subject+"' and term_id='"+req.body.term+"' and "+
  " ((STR_TO_DATE( planned_date_from,  '%m/%d/%Y' ) <= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' )) "+
  " OR (STR_TO_DATE( planned_to_date,  '%m/%d/%Y' ) >= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' ))) "+
  " and sub_concept_id not in(select sub_concept_id from md_curriculum_planning_approval "+
  " where school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' and emp_id='"+req.body.empid+"' "+
  " and section_id='"+req.body.section+"' and subject_name='"+req.body.subject+"')";
   var query = connection.query(que, function(err, rows)
    {
          if(!err){
          if(rows.length>0)
          res.status(200).json(rows);
          else
          res.status(200).json('no rows'+que);
          }
          else
          res.status(200).json('Error!'+err);
    });   
});

app.post('/lessonplanchapterconcepts',  urlencodedParser,function (req, res)
{
  var que = "select distinct(concept_id),concept_name from md_curriculum_planning where school_id='"+req.body.schoolid+"' and "+
  " academic_year='2017-2018' and grade_name='"+req.body.grade+"' and subject_name='"+req.body.subject+"' and term_id='"+req.body.term+"' and "+
  " ((STR_TO_DATE( planned_date_from,  '%m/%d/%Y' ) <= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' )) "+
  " OR (STR_TO_DATE( planned_to_date,  '%m/%d/%Y' ) >= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' ))) "+
  " and row_id='"+req.body.rowid+"' and chapter_id='"+req.body.chapterid+"' "+
  " and sub_concept_id not in(select sub_concept_id from md_curriculum_planning_approval "+
  " where school_id =  '"+req.body.schoolid+"' AND academic_year =  '2017-2018' and emp_id='"+req.body.empid+"' "+
  " and section_id='"+req.body.section+"' and subject_name='"+req.body.subject+"')";
    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          res.status(200).json(rows);
          }
          else
          res.status(200).json('Error!'+err);
    });   
});


app.post('/lessonplanchaptersubconcepts',  urlencodedParser,function (req, res)
{
  var que = "select distinct(sub_concept_id),sub_concept_name from md_curriculum_planning where school_id='"+req.body.schoolid+"' and "+
  " academic_year='2017-2018' and grade_name='"+req.body.grade+"' and subject_name='"+req.body.subject+"' and term_id='"+req.body.term+"' and "+
  " ((STR_TO_DATE( planned_date_from,  '%m/%d/%Y' ) <= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' )) "+
  " OR (STR_TO_DATE( planned_to_date,  '%m/%d/%Y' ) >= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' ))) "+
  " and row_id='"+req.body.rowid+"' and chapter_id='"+req.body.chapterid+"' and concept_id='"+req.body.conceptid+"' "+
  " and sub_concept_id not in (select sub_concept_id from md_curriculum_planning_approval where school_id='"+req.body.schoolid+"' and "+
  " academic_year='2017-2018' and grade_name='"+req.body.grade+"' and subject_name='"+req.body.subject+"' and term_id='"+req.body.term+"' "+
  " and section_id='"+req.body.section+"' and completion_status='yes' and row_id='"+req.body.rowid+"' and chapter_id='"+req.body.chapterid+"' and concept_id='"+req.body.conceptid+"' and emp_id='"+req.body.empid+"')";
    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          res.status(200).json(rows);
          }
          else
          res.status(200).json('Error!'+err);
    });   
});

app.post('/lessonplancompleteactivityinfo',  urlencodedParser,function (req, res)
{
  var que = "select * from md_curriculum_planning where school_id='"+req.body.schoolid+"' and "+
  " academic_year='2017-2018' and grade_name='"+req.body.grade+"' and subject_name='"+req.body.subject+"' and term_id='"+req.body.term+"' and "+
  " ((STR_TO_DATE( planned_date_from,  '%m/%d/%Y' ) <= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' )) "+
  " OR (STR_TO_DATE( planned_to_date,  '%m/%d/%Y' ) >= STR_TO_DATE(  '"+req.body.currdate+"',  '%d/%m/%Y' ))) "+
  " and row_id='"+req.body.rowid+"' and chapter_id='"+req.body.chapterid+"' and concept_id='"+req.body.conceptid+"' "+
  " and sub_concept_id='"+req.body.subconceptid+"'";  
  
    var query = connection.query(que, function(err, rows)
    {
          if(!err){
          res.status(200).json(rows);
          }
          else
          res.status(200).json('Error!'+err);
    });   
});

app.post('/lessonplancompletenesssave',  urlencodedParser,function (req, res)
{
  var response={ 
      school_id: req.body.schoolid,
      academic_year: '2017-2018',
      emp_id:req.body.empid,
      emp_name:req.body.empname,
      grade_id: req.body.gradeid,
      grade_name: req.body.gradename,
      section_id: req.body.sectionid,
      section_name: req.body.sectionname,
      subject_id: req.body.subjectid,
      subject_name: req.body.subjectname,
      chapter_id: req.body.chapterid,
      chapter_name: req.body.chaptername,
      row_id: req.body.rowid,
      concept_id: req.body.conceptid,
      concept_name: req.body.conceptname,
      sub_concept_id: req.body.subconceptid,
      sub_concept_name: req.body.subconceptname,
      period: req.body.period,
      planned_date_from: req.body.fromdate,
      planned_to_date: req.body.todate,
      skill: req.body.skill,
      value: req.body.value,
      innovation: req.body.innovation,
      lr_rectification: req.body.lr,
      remarks: req.body.coremark,
      correction_status: req.body.correctionstatus, 
      completion_status: req.body.completionstatus ,
       // enrichment_sug: req.query.enrichmentsuggest ,
       completion_date: req.body.completiondate,
       term_id:req.body.term,
       bld_value_name:req.body.bldvalue,
       teaching_aid:req.body.teachingaid,
       co_ordinator_remarks:req.query.remark,
       sno: req.body.rowid
    };
    connection.query("INSERT INTO md_curriculum_planning_approval SET ?",[response],function(err, rows){
    if(!err)
    {  
    res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated'}); 
    }
    });
});

app.post('/send',  urlencodedParser,function (req, res){
var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
        to: req.body.senttoid, 
        // collapse_key: 'your_collapse_key',        
        notification: {
            title: req.body.title, 
            body: req.body.empname+":"+req.body.issue 
        },        
        data: {  //you can send only notification or only data(or include both) 
            name: req.body.empname
        }
    };    
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!");
            res.status(200).json({'returnval': 'sent'+response+" "+response.statusCode+"  "+response.statusMessage});
        } else {
            console.log("Successfully sent with response: ", response);
            res.status(200).json({'returnval': err+"  "+response+" "+response.statusCode+"  "+response.statusMessage});
        }
    });
});

app.post('/smis-logincheck',  urlencodedParser,function (req, res){
  var checkqur="SELECT * FROM md_register WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND school_id='"+req.body.school_id+"'";
  var checkqur1="SELECT * FROM md_register WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND device_id!='"+req.body.reg_id+"' AND school_id='"+req.body.school_id+"'";
  var updatequr="UPDATE md_register SET device_id='"+req.body.reg_id+"' WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND school_id='"+req.body.school_id+"'";
  var deletequr="DELETE FROM md_register WHERE WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND school_id='"+req.body.school_id+"'";
  connection.query(checkqur,function(err, rows){
    if(!err){
      if(rows.length>0){
       connection.query(updatequr,function(err, result){
          if(result.affectedRows>0){
            res.status(200).json({'returnval': 'Updated'});
          }
          else
          {
            connection.query(deletequr,function(err, result){
              if(result.affectedRows>0){
                res.status(200).json({'returnval': 'Deleted'});
              }
            });
          }
        });
      }
    }
  });

});

app.post('/smis-login',  urlencodedParser,function (req, res){

  var qur="SELECT * FROM md_employee_creation WHERE emp_id='"+req.body.emp_id+"' AND emp_mobile='"+req.body.mob_no+"' and flage='active' and academic_year='2017-2018'";
  var insertqur="INSERT INTO md_register SET ?";
  var school_id="";
  var role="";
  var emp_name="";
  var param={
    school_id:'',
    id:req.body.emp_id,
    password:req.body.mob_no,
    device_id:req.body.reg_id,
    role:''
  };

  connection.query(qur,function(err, rows){
    if(!err){
      if(rows.length>0){
        school_id=rows[0].school_id;
        role=rows[0].role;
        emp_name=rows[0].emp_name;
        param.school_id=rows[0].school_id;
        param.role=rows[0].role;
      connection.query("SELECT * FROM md_register WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND school_id='"+school_id+"' ",function(err, rows){        
      if(!err){
       if(rows.length==0){
        connection.query(insertqur,[param],function(err, rows){
        if(!err)
        res.status(200).json({'returnval': 'Success','schoolid':school_id,'empname':emp_name,'emprole':role});
        else
        res.status(200).json({'returnval': err});
        });
      }
      else{
        connection.query("UPDATE md_register SET device_id='"+req.body.reg_id+"' WHERE id='"+req.body.emp_id+"' AND password='"+req.body.mob_no+"' AND school_id='"+school_id+"'",function(err, rows){        
        if(!err)
        res.status(200).json({'returnval': 'Exist','schoolid':school_id,'empname':emp_name,'emprole':role});
        else
        res.status(200).json({'returnval': err});
        });
      }
      }
      else
        res.status(200).json({'returnval': 'invalid'});
      });
      } 
      else {
        res.status(200).json({'returnval': 'invalid'});
      }
    }
    else{
      console.log('hi');
      console.log(err);
      console.log('hi2');
    }
  });
});


app.post('/smisrolecheck-service',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_employee WHERE id='"+req.body.emp_id+"' AND school_id='"+req.body.school_id+"' and academic_year='"+req.body.academic_year+"' and flage='active' and role_id in('co-ordinator','class-teacher')",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': 'valid'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchacademicyear',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_academicyear order by academic_year desc",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchassesment',  urlencodedParser,function (req, res)
{
    connection.query("SELECT distinct(assesment_type) FROM enrichment_subject_mapping WHERE academic_year='"+req.body.academic_year+"' ",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchgrades',  urlencodedParser,function (req, res)
{
    connection.query("SELECT *,(SELECT grade_name FROM md_grade g WHERE g.grade_id=m.grade_id) as grade_name FROM mp_teacher_grade m WHERE m.id='"+req.body.emp_id+"' AND m.school_id='"+req.body.school_id+"' and m.academic_year='"+req.body.academic_year+"' and m.flage='active' and m.role_id in('co-ordinator','class-teacher')",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchsections',  urlencodedParser,function (req, res)
{
    connection.query("SELECT * FROM md_class_section WHERE school_id='"+req.body.school_id+"' and academic_year='"+req.body.academic_year+"' and class='"+req.body.grade+"'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchsubjects',  urlencodedParser,function (req, res)
{
    connection.query("SELECT distinct(subject_name) FROM enrichment_subject_mapping WHERE school_id='"+req.body.school_id+"' and academic_year='"+req.body.academic_year+"' and assesment_type='"+req.body.assesment+"' and grade_name='"+req.body.grade+"'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchsubcategory',  urlencodedParser,function (req, res)
{
    connection.query("SELECT distinct(sub_category_name),subject_name,category_name FROM enrichment_subject_mapping WHERE school_id='"+req.body.school_id+"' and academic_year='"+req.body.academic_year+"' and assesment_type='"+req.body.assesment+"' and grade_name='"+req.body.grade+"' and assesment_type='"+req.body.assesment+"' and "+
    "subject_name='"+req.body.subject+"'",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchchartinfo',  urlencodedParser,function (req, res)
{
    connection.query("SELECT level,count(distinct(student_id)) as count FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' group by level order by grade",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchstudentinfo',  urlencodedParser,function (req, res)
{
    connection.query("SELECT distinct(student_name),grade FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' and level='"+req.body.level+"' order by student_name",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchstudentinfoforanalysis',  urlencodedParser,function (req, res)
{
// connection.query("SELECT distinct(student_name),grade FROM scorecarddb.tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
// " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
// " and subject_name='"+req.body.subject+"' and level='"+req.body.level+"' order by student_name",
if(req.body.assesment=="BOY"||req.body.assesment=="EBOY")
var qur="SELECT distinct(t.student_name),ASCII(t.grade) moy,ASCII(t.grade) boy FROM tr_beginner_assesment_marks t where "+
" t.school_id='"+req.body.school_id+"' and t.academic_year='"+req.body.academic_year+"' and t.grade_id='"+req.body.grade+"' and t.section_id='"+req.body.section+"' "+
" and t.assesment_id='"+req.body.assesment+"' and t.subject_name='"+req.body.subject+"' and t.level='"+req.body.level+"' order by student_name";  
if(req.body.assesment=="MOY"||req.body.assesment=="EMOY"){
  if(req.body.assesment=="MOY")
  var col="BOY";
  if(req.body.assesment=="EMOY")
  var col="EBOY";
var qur="SELECT distinct(t.student_name),ASCII(t.grade) moy,(SELECT distinct(ASCII(b.grade)) FROM "+
" tr_beginner_assesment_marks b where b.school_id='"+req.body.school_id+"' and b.academic_year='"+req.body.academic_year+"' and b.grade_id='"+req.body.grade+"' and "+
" b.section_id='"+req.body.section+"' and b.assesment_id='"+col+"' and b.subject_name='"+req.body.subject+"' and "+
" b.student_id=t.student_id) as boy FROM tr_beginner_assesment_marks t where "+
" t.school_id='"+req.body.school_id+"' and t.academic_year='"+req.body.academic_year+"' and t.grade_id='"+req.body.grade+"' and t.section_id='"+req.body.section+"' "+
" and t.assesment_id='"+req.body.assesment+"' and t.subject_name='"+req.body.subject+"' and t.level='"+req.body.level+"' order by student_name";
}
if(req.body.assesment=="EOY"||req.body.assesment=="EEOY"){
  if(req.body.assesment=="EOY")
  var col="MOY";
  if(req.body.assesment=="EEOY")
  var col="EMOY";
var qur="SELECT distinct(t.student_name),ASCII(t.grade) moy,(SELECT distinct(ASCII(b.grade)) FROM "+
" tr_beginner_assesment_marks b where b.school_id='"+req.body.school_id+"' and b.academic_year='"+req.body.academic_year+"' and b.grade_id='"+req.body.grade+"' and "+
" b.section_id='"+req.body.section+"' and b.assesment_id='"+col+"' and b.subject_name='"+req.body.subject+"' and "+
" b.student_id=t.student_id) as boy FROM tr_beginner_assesment_marks t where "+
" t.school_id='"+req.body.school_id+"' and t.academic_year='"+req.body.academic_year+"' and t.grade_id='"+req.body.grade+"' and t.section_id='"+req.body.section+"' "+
" and t.assesment_id='"+req.body.assesment+"' and t.subject_name='"+req.body.subject+"' and t.level='"+req.body.level+"' order by student_name";
}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchlevelinfo',  urlencodedParser,function (req, res)
{
    connection.query("SELECT level,count(distinct(student_id)) as count FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' group by level order by grade",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchsublevelinfo',  urlencodedParser,function (req, res)
{
  var qur="";
    if(req.body.subcategory=="Speed")
      qur="SELECT speed_level as level,count(distinct(student_id)) as count FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and level='"+req.body.level+"' group by speed_level order by grade";
    else if(req.body.subcategory=="Comprehension")
      qur="SELECT comprehension_level as level,count(distinct(student_id)) as count FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and level='"+req.body.level+"' group by comprehension_level order by grade";
    else
      qur="SELECT enrich_level as level,count(distinct(student_id)) as count FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"' and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and level='"+req.body.level+"' group by enrich_level order by grade";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid'+err);
    }
    }
    else
      console.log(err);
});
});

app.post('/smis-fetchsublevelstudentinfo',  urlencodedParser,function (req, res)
{
    if(req.body.subcategory=="Speed")
    var qur="SELECT distinct(student_name) FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"'  and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and speed_level='"+req.body.sublevel+"' "+
    " and level='"+req.body.level+"' order by student_name";
    else if(req.body.subcategory=="Comprehension")
    var qur="SELECT distinct(student_name) FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"'  and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and comprehension_level='"+req.body.sublevel+"' "+
    " and level='"+req.body.level+"' order by student_name";
    else
    var qur="SELECT distinct(student_name) FROM tr_beginner_assesment_marks where school_id='"+req.body.school_id+"' and "+
    " academic_year='"+req.body.academic_year+"' and grade_id='"+req.body.grade+"' and section_id='"+req.body.section+"' and assesment_id='"+req.body.assesment+"' "+
    " and subject_name='"+req.body.subject+"'  and  category_name='"+req.body.category+"' and sub_category_name='"+req.body.subcategory+"' and enrich_level='"+req.body.sublevel+"' "+
    " and level='"+req.body.level+"' order by student_name";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json(rows);
    }
    else
    {
      console.log(err);
      res.status(200).json('invalid');
    }
    }
    else
      console.log(err);
});
});

// app.post('/checkschool-card',  urlencodedParser,function (req, res)
// {
//     var id={"id":req.query.username};
//     connection.query('SELECT name from md_school where id in (select school_id from md_employee where ?) ',[id],
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });

// app.post('/rolecheck-service',  urlencodedParser,function (req, res)
// {
//   logfile = fs.createWriteStream('./app/configfile/logfile.txt', {flags: 'a'});
// console.log('logfile.........');
// console.log(logfile);

//   var id={"id":req.query.username};
//   var username={"id":req.query.username};
//   var password={"password":req.query.password};
//   // connection.query('select id,role_name from md_role where id in (select role_id from md_employee where ? and ? )',[id,password],
//   var qur="select distinct(mr.id),mr.role_name,(select name from md_school where id=me.school_id) as name,me.school_id "+
//   "from md_role mr join md_employee me on(mr.id=me.role_id) "+
//   "where me.id='"+req.query.username+"' and me.flage='active' and password='"+req.query.password+"'";

//   console.log('.............role.....................');
//   console.log(qur);
//   connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     { 
//       console.log(err);     
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else   
//       console.log(err);
//   });
// });

app.post('/checkschool-card',  urlencodedParser,function (req, res)
{
    var id={"id":req.query.username};
    connection.query('SELECT name from md_school where id in (select school_id from md_employee where ?) ',[id],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/rolecheck-service',  urlencodedParser,function (req, res)
{
  logfile = fs.createWriteStream('./app/configfile/logfile.txt', {flags: 'a'});
console.log('logfile.........');
console.log(logfile);

  var id={"id":req.query.username};
  var username={"id":req.query.username};
  var password={"password":req.query.password};
  // connection.query('select id,role_name from md_role where id in (select role_id from md_employee where ? and ? )',[id,password],
  var qur="select distinct(mr.id),mr.role_name,(select name from md_school where id=me.school_id) as name,me.school_id "+
  "from md_role mr join md_employee me on(mr.id=me.role_id) "+
  "where me.id='"+req.query.username+"' and me.flage='active' and password='"+req.query.password+"'";

  console.log('.............role.....................');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    { 
      console.log(err);     
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else   
      console.log(err);
  });
});


app.post('/login-card',  urlencodedParser,function (req, res)
{
  var id={"id":req.query.username};
  var username={"id":req.query.username};
  var password={"password":req.query.password};
  var schoolid={school_id:req.query.schoolid};
  connection.query('SELECT name as uname,  school_id as school,(select name from md_school where id=school) as name ,(select Board from md_school where id=school) as board,(select address from md_school where id=school) as addr,(select affiliation_no from md_school where id=school) as affno,(select email_id from md_school where id=school) as email,(select website from md_school where id=school) as website,(select telno from md_school where id=school) as telno  from md_employee where ? and ? and ? and ?',[id,username,password,schoolid],
    function(err, rows)
    {
    if(!err)  
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    { 
      console.log(err);     
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
    
  });
});

//changing teachers password
app.post('/changepassword-service',  urlencodedParser,function (req, res)
{
  
  var username={"id":req.query.username};
  var oldpassword={"password":req.query.oldpassword};
  var newpassword={"password":req.query.newpassword};
  var schoolid={"school_id":req.query.schoolid};
  console.log(schoolid);
  console.log(username);
  console.log(oldpassword);
  console.log(newpassword);
  connection.query('UPDATE md_employee SET ? WHERE ? and ? and ?',[newpassword,username,oldpassword,schoolid],
    function(err,result)
    {
      console.log('..............result..............');
      console.log(result.affectedRows);
    if(!err)
    {  
      if(result.affectedRows>0)  
      res.status(200).json({'returnval': 'Password changed!'});
    
    else
    {
      console.log(err);     
      res.status(200).json({'returnval': 'Password not changed!'});
    }
    }
    else
      console.log(err);    
  });
});


//Function to select the assesment type id
app.post('/assesmenttype-service',  urlencodedParser,function (req, res)
{
  var schoolid={"id":req.query.schoolid};
  var assesmentname={"assesment_name":req.query.assesmentname};  
  var qur="SELECT * FROM md_assesment_type_category WHERE assesment_id in(SELECT assesment_id from md_assesment_type where assesment_name='"+req.query.assesmentname+"')";
  console.log('------------------------------------------------');
  console.log(qur);
  connection.query('SELECT * FROM md_assesment_type_category WHERE assesment_id in(SELECT assesment_id from md_assesment_type where ?)',[assesmentname],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


//fetching grade info
app.post('/term-service',  urlencodedParser,function (req, res)
{
  

if(req.query.roleid=='subject-teacher'||req.query.roleid=='class-teacher'||req.query.roleid=='co-ordinator')
       var qur="select distinct(term_id),term_name from md_grade_assesment_mapping where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and "+
  " grade_id in (select grade_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')";
  else
    var qur="select distinct(term_id),term_name from md_grade_assesment_mapping where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"'";
 
  console.log('term service....');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/schoolterm-service',  urlencodedParser,function (req, res)
{
  


   var qur="select distinct(term_id),term_name from md_grade_assesment_mapping where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"'";
 
  console.log('schoolterm ....');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
/*app.post('/enrichassesment-service',  urlencodedParser,function (req, res)
  {
 
    var qur="select distinct(assesment_type) from enrichment_subject_mapping where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subjectname+"'";
 
   console.log('term service....');
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});*/
app.post('/enrichassesment-service',  urlencodedParser,function (req, res)
{
  
  
  var qur="select distinct(assesment_type) as term_id from enrichment_subject_mapping where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subjectname+"'";
 
  console.log('term service....');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
//fetching grade info
app.post('/grade-service',  urlencodedParser,function (req, res)
{
  var schoolid={school_id:req.query.schoolid};
  var loggedid={id:req.query.loggedid};
  var roleid={role_id:req.query.roleid};
  console.log(roleid);
  // var qur="select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where id='"+loggedid+"')";
  if(req.query.roleid=='subject-teacher')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
  "in(select grade_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"') and grade_id in( select  grade_id from md_grade_assesment_mapping where  school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academicyear+"' and  term_name='"+req.query.term+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"') and grade_id in( select  grade_id from md_grade_assesment_mapping where  school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academicyear+"' and  term_name='"+req.query.term+"')";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"') and grade_id in( select  grade_id from md_grade_assesment_mapping where  school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academicyear+"'and  term_name='"+req.query.term+"')";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management' || req.query.roleid=='studentadmin')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
  }

  console.log('-------------------grade----------------------');
  console.log(qur);

  // connection.query('select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where ? and ? and ?)',[roleid,schoolid,loggedid],
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});



app.post('/grade1-service',  urlencodedParser,function (req, res)
{
  var schoolid={school_id:req.query.schoolid};
  var loggedid={id:req.query.loggedid};
  var roleid={role_id:req.query.roleid};
  console.log(roleid);
  // var qur="select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where id='"+loggedid+"')";
  if(req.query.roleid=='subject-teacher')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
  "in(select grade_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"')";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"')";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management' || req.query.roleid=='studentadmin')
  {
    var qur="select grade_name,grade_id from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
  }

  console.log('-------------------grade----------------------');
  console.log(qur);

  // connection.query('select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where ? and ? and ?)',[roleid,schoolid,loggedid],
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/searchstudentinfo-service',  urlencodedParser,function (req, res)
{
  var schoolid={school_id:req.query.schoolid};
  var loggedid={id:req.query.loggedid};
  var roleid={role_id:req.query.roleid};
  console.log(roleid);
  // var qur="select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where id='"+loggedid+"')";
 
 var qur="select distinct(id),student_name from md_student where school_id='"+req.query.schoolid+"'";

 
  console.log('-------------------Studentt----------------------');
  console.log(qur);

  // connection.query('select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where ? and ? and ?)',[roleid,schoolid,loggedid],
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});





//fetching section info
app.post('/section-service',  urlencodedParser,function (req, res)
{  
  if(req.query.roleid=='subject-teacher')
  {
    //console.log('1');
    // var qur="select * from md_section where section_id in "+
    // "(select distinct(section_id) from mp_teacher_grade where "+
    // "school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' "+
    // "and id='"+req.query.loggedid+"' and grade_id=(select grade_id from md_grade "+
    // "where grade_name='"+req.query.gradename+"') and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' ";
    var qur="select distinct(section_id) ,UPPER(section_id) as section_name,class_id from mp_grade_section  where class_id in (select distinct(tg.class_id) from "+
    " mp_teacher_grade tg join md_grade g on(tg.grade_id=g.grade_id) where "+
    " tg.role_id='"+req.query.roleid+"' and tg.id='"+req.query.loggedid+"' and tg.school_id='"+req.query.schoolid+"' and "+ 
    " tg.academic_year='"+req.query.academicyear+"' and g.grade_name='"+req.query.gradename+"') and school_id='"+req.query.schoolid+"' and "+ 
    " academic_year='"+req.query.academicyear+"' and grade_id in (select grade_id from md_grade where school_id='"+req.query.schoolid+"' "+ 
    " and  academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.gradename+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    //console.log('2');
    // var qur="select * from md_section where section_id in "+
    // "(select distinct(section_id) from mp_teacher_grade where "+
    // "school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' "+
    // "and id='"+req.query.loggedid+"' and grade_id=(select grade_id from md_grade "+
    // "where grade_name='"+req.query.gradename+"') and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' ";
    var qur="select distinct(section_id) ,UPPER(section_id) as section_name,class_id from mp_grade_section  where class_id in (select distinct(tg.class_id) from "+
    " mp_teacher_grade tg join md_grade g on(tg.grade_id=g.grade_id) where "+
    " tg.id='"+req.query.loggedid+"' and tg.school_id='"+req.query.schoolid+"' and tg.academic_year='"+req.query.academicyear+"' and "+
    " g.grade_name='"+req.query.gradename+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    //console.log('3');
    // var qur="select * from md_section where section_id in "+
    // "(select distinct(section_id) from mp_teacher_grade where "+
    // "grade_id=(select grade_id from md_grade where "+
    // "school_id='"+req.query.schoolid+"' and grade_name='"+req.query.gradename+"') and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"'";
    var qur="select distinct(section_id) ,UPPER(section_id) as section_name,class_id from mp_grade_section  where class_id in (select distinct(tg.class_id) from mp_teacher_grade tg join md_grade g on(tg.grade_id=g.grade_id) where "+
    " tg.school_id='"+req.query.schoolid+"' and tg.academic_year='"+req.query.academicyear+"' and g.grade_name='"+req.query.gradename+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
  }
  else if(req.query.roleid=='headmistress')
  {
    
   var qur="select distinct(section_id) ,UPPER(section_id) as section_name,class_id from mp_grade_section  where class_id in (select distinct(tg.class_id) from mp_teacher_grade tg join md_grade g on(tg.grade_id=g.grade_id) where "+
    " tg.school_id='"+req.query.schoolid+"' and tg.academic_year='"+req.query.academicyear+"' and g.grade_name='"+req.query.gradename+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    }

   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management' || req.query.roleid=='studentadmin')
     {
 var qur="select distinct(section_id),UPPER(section_id) as section_name,class_id from mp_grade_section  where class_id in (select distinct(tg.class_id) from mp_teacher_grade tg join md_grade g on(tg.grade_id=g.grade_id) where "+
    " tg.school_id='"+req.query.schoolid+"' and tg.academic_year='"+req.query.academicyear+"' and g.grade_name='"+req.query.gradename+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    //console.log('5');
    // var qur="select * from md_section where section_id in "+
    // "(select distinct(section_id) from mp_teacher_grade where "+
    // "grade_id in(select distinct(grade_id) from mp_teacher_grade where grade_id=(select grade_id from md_grade "+
    // "where grade_name='"+req.query.gradename+"') and "+
    // "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"'";
  }


  console.log('-------------------section----------------------');
  console.log(qur);
  // var qur="select * from md_section where section_id in(select section_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' and id='"+req.query.loggedid+"' and grade_id=(select grade_id from scorecarddb.md_grade where grade_name='"+req.query.gradename+"'))";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchapprovalsubject-service',  urlencodedParser,function (req, res)
{
  if(req.query.roleid=='subject-teacher')
  {
    var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) "+
  " and subject_category in('"+req.query.subjectcategory+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    var qur="select distinct(s.subject_id),s.subject_name,s.language_pref from md_subject s join "+
    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"'";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    var qur="select distinct(s.subject_id),s.subject_name,s.language_pref from md_subject s join "+
    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"'";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select distinct(s.subject_id),s.subject_name,s.language_pref from md_subject s join "+
    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"'";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject)";
  }
console.log('-------------------subject----------------------');
  console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });});

//fetching section info
app.post('/subject-service',  urlencodedParser,function (req, res)
{

  if(req.query.roleid=='subject-teacher')
  {
    var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) "+
  " and subject_category in('"+req.query.subjectcategory+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {

    

    var qur="select distinct(s.subject_id),s.subject_name,s.type,s.language_pref from md_subject s join "+

    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"' and g.subject_category in('"+req.query.subjectcategory+"') and t.grade_id in(select grade_id from md_grade where grade_name='"+req.query.gradename+"')";
    // var qur="select * from md_subject where subject_id in "+
    // "(select subject_id from mp_grade_subject where grade_id "+
    // "in(select grade_id from mp_teacher_grade where "+
    // "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"') "+
    // "and subject_category in('"+req.query.subjectcategory+"')) ";
  }
   else if(req.query.roleid=='co-ordinator')
  {

    var qur="select distinct(s.subject_id),s.type,s.subject_name,s.language_pref from md_subject s join "+
      " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"' and s.subject_category in('"+req.query.subjectcategory+"')";
   
    // var qur="select * from md_subject where subject_id in "+
    // "(select subject_id from mp_grade_subject where grade_id "+
    // "in(select grade_id from mp_teacher_grade where "+
    // "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'))";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select distinct(s.subject_id),s.subject_name, s.type,s.language_pref from md_subject s join "+
    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"' and s.subject_category in('"+req.query.subjectcategory+"')";
   
    // var qur="select * from md_subject where subject_id in "+
    // "(select subject_id from mp_grade_subject) and subject_category in('"+req.query.subjectcategory+"')";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject) and subject_category in('"+req.query.subjectcategory+"')";
  }
console.log('-------------------subject----------------------');
  console.log(qur);

  // var qur="select subject_name from md_subject where subject_id in(select subject_id from mp_grade_subject where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"'))";
  // console.log(qur);
  /*if(req.query.roleid=='subject-teacher'){
  var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"')) and subject_category='"+req.query.subjectcategory+"' and subject_id not in('s16','s17','s20')";
  }
  if(req.query.roleid=='class-teacher'){
   var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"')) and subject_category='"+req.query.subjectcategory+"'"; 
  }*/
   // console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching category info
app.post('/category-service',  urlencodedParser,function (req, res)
{
  //var qur="select subject_category_name from md_subject where subject_id in(select subject_id from mp_grade_subject where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"'))";
  // console.log(qur);
var qur="select subject_category_name from md_subject_category where subject_category_id in(select distinct subject_category_id from md_grade_subject_category_mapping"+
" where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and"+
" grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and"+
" subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"'))";
// console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


//fetching subcategory info
app.post('/subcategory-service',  urlencodedParser,function (req, res)
{
var qur="select subject_sub_category_name from md_subject_sub_category where subject_sub_category_id in(select distinct subject_sub_category_id from md_grade_subject_category_mapping where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and subject_category_id=(select subject_category_id from md_subject_category where subject_category_name='"+req.query.category+"'))";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/subject1-service',  urlencodedParser,function (req, res)
{
var qur="select distinct(s.subject_id),s.subject_name,s.language_pref from md_subject s join "+
    " mp_grade_subject g on(s.subject_id=g.subject_id) join mp_teacher_grade t "+
    " on(g.grade_id=t.grade_id) where g.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and t.id='"+req.query.loggedid+"' and t.school_id='"+req.query.schoolid+"' and t.academic_year='"+req.query.academicyear+"' and "+
    " t.role_id='"+req.query.roleid+"' and s.subject_category in('"+req.query.subjectcategory+"')";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/callTermService1-service',  urlencodedParser,function (req, res)
{
var qur="select distinct(term_id),term_name from md_grade_assesment_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade+"'";
console.log(qur);

    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/fngetstudentterm-service',  urlencodedParser,function (req,res)
{  
    var qur="SELECT distinct(term_id),term_name from md_grade_assesment_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' ";
    var qur1="select * from md_class_section where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and class='"+req.query.grade+"'"
    console.log(qur);
    console.log(qur1);
    var sectionarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    { 
    sectionarr=rows; 
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    res.status(200).json({'returnval':rows,'sectionarr':sectionarr});
    }
    else
    res.status(200).json({'returnval':'no rows'}); 
  });
  }
});
});


 app.post('/getalltermmarks-service',  urlencodedParser,function (req,res)
  {  
   var qur1="Select * from md_student where id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' AND flag='active'";
    console.log(qur1);
    var qur;    
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
     if(rows.length>0){ 
      if(rows[0].grade_id=='g2'|| rows[0].grade_id=='g3' || rows[0].grade_id=='g4' ||rows[0].grade_id=='g1'){
     
     qur="select distinct(term_name) from tr_term_assesment_marks where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'";
      console.log(qur);
  
       }
       else{ 
      qur="select distinct(term_name) from tr_term_fa_assesment_marks where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'";
     console.log(qur);
  
       }
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    if(rows.length>0)
    res.status(200).json({'returnval':rows});
    else
    res.status(200).json({'returnval':'no rows'}); 
    }
    });
    }
    else
     res.status(200).json({'returnval':'no rows'}); 
   }
    else
     res.status(200).json({'returnval':'no rows'}); 
  });
});


 app.post('/getalltermmarks-service1',  urlencodedParser,function (req,res)
  {  
   var qur1="Select * from md_student where id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' AND flag='active'";
    console.log(qur1);
    var qur;    
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
     if(rows.length>0){ 
      if(rows[0].grade_id=='g2'|| rows[0].grade_id=='g3' || rows[0].grade_id=='g4' ||rows[0].grade_id=='g1'){
     
     qur="select distinct(term_name) from tr_term_assesment_marks where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'";
      console.log(qur);
  
       }
       else{ 
      qur="select distinct(term_name) from tr_term_fa_assesment_marks where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'";
     console.log(qur);
  
       }
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    if(rows.length>0)
    res.status(200).json({'returnval':rows});
    else
    res.status(200).json({'returnval':'no rows'}); 
    }
    });
    }
    else
     res.status(200).json({'returnval':'no rows'}); 
   }
    else
     res.status(200).json({'returnval':'no rows'}); 
  });
});


//fetching teachers assesment card info
app.post('/assesment-service',  urlencodedParser,function (req, res)
{
// var qur="select assesment_cyclename from md_assesment_cycle where assesment_cycleid in(select assesment_cycleid from mp_assesment_term_cycle where assesment_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and term_id=(select term_id from md_term where term_name='"+req.query.termname+"'))";
     var qur="select * from md_grade_assesment_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade_name='"+req.query.gradename+"'";
  console.log("..............Reading assesment..........");
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/assesment1-service',  urlencodedParser,function (req, res)
{
// var qur="select assesment_cyclename from md_assesment_cycle where assesment_cycleid in(select assesment_cycleid from mp_assesment_term_cycle where assesment_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and term_id=(select term_id from md_term where term_name='"+req.query.termname+"'))";
    var qur="select * from md_grade_assesment_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade_name='"+req.query.gradename+"'and  assesment_id in  (select distinct(assesment_id) from single_student_markentry_table where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and subject_category='"+req.query.category+"' and student_id='"+req.query.studentid+"' and subject='"+req.query.subject+"' and flag='completed')";
  console.log("..............Reading assesment..........");
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});



app.post('/fetchstudentbeginner-service',  urlencodedParser,function (req, res)
{
var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' order by student_name";
 console.log('--------------------------enrichment stud fetch------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);  
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

app.post('/fetchbeginnerstudentforreport-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_type='"+req.query.assesmenttype+"' and "+
" grade_id='"+req.query.grade+"' and section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"'";
 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchsubjectstudent-service',  urlencodedParser,function (req, res)
{
console.log(req.query.langpref);
if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
{
var qur="select school_id,student_id as id,student_name,class_id from tr_student_to_subject where class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and subject_id='"+req.query.subjectid+"' and flag='active' order by student_name";
}
else{
var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' order by student_name";
}
 console.log('--------------------------enrichment stud fetch------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'no rows'});
    }  
  });
});


app.post('/fetchsubjectstudent1-service',  urlencodedParser,function (req, res)
{
console.log(req.query.langpref);
if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
{
var qur="select school_id,student_id as id,student_name,class_id from tr_student_to_subject where student_id='"+req.query.studentid+"' and class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and subject_id='"+req.query.subjectid+"' and flag='active' order by student_name";
}
else{
var qur="select school_id,id,student_name,class_id  from md_student where id='"+req.query.studentid+"' and class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' order by student_name";
}
 console.log('--------------------------enrichment stud fetch------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'no rows'});
    }  
  });
});

 app.post('/fetchstudentforscholasticsubjectreport-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_term_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name";
 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentforscholasticsubjectreport1-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name";
 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforscholasticsubjectreport2-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_term_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'  and student_id='"+req.query.studentid+"' order by student_name";
 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforsubjectreport-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name";
 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforsubjectreport2-service',  urlencodedParser,function (req, res)
{
  var qur;
  if(req.query.category=="category1")
  {
  qur="SELECT * FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'and student_id='"+req.query.studentid+"' order by student_name"; 
  }
  else if(req.query.category=="category2")
  {
  
  qur="select * from tr_coscholastic_assesment_marks where academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' order by sub_seq";
 }
 console.log('--------------------------co scholastic fetch report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforhealth-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  flag='active' and id not in(select student_id from tr_term_health where   term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchstudentforhealth1-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  id='"+req.query.studentid+"' and class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  flag='active' and id not in(select student_id from tr_term_health where   term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforattendance1-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where id='"+req.query.studentid+"' and class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' and id not in(select student_id from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
 //console.log(qur);
 connection.query(qur,
  
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



app.post('/fetchstudentforattendance-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' and id not in(select student_id from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
 //console.log(qur);
 connection.query(qur,
  
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforattendance-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,attendance,working_days,speccomment,generic from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' order by student_name";
 //console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchstudentreportforattendance1-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,attendance,working_days,speccomment,generic from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' order by student_name";
 //console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchstudentreportforcoscholastic-service',  urlencodedParser,function (req, res)
{ 

var qurcheck;
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    console.log('c');
    flag="0";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"'  and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    console.log('o');
    flag="1";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and  subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

 

  var qur="select * from tr_coscholastic_assesment_marks where academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' order by sub_seq";
 //console.log(qur);
 //console.log(qurcheck);
   connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0)
    {
    console.log('f');
    connection.query(qur,function(err, rows)  
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
    });
    }
    else{
    console.log('d');
    res.status(200).json({'returnval': 'imported'});
    }
    }
    else
    console.log(err);
  });
});
app.post('/fetchexcelreportforcoscholastic-service',  urlencodedParser,function (req, res)
{ 
  var qur="select * from tr_coscholastic_assesment_marks where academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' order by sub_seq";
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });

});

app.post('/fetchstudentforcoscholastic-service',  urlencodedParser,function (req, res)
{
var qur="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' order by student_name";
 //console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforphysical-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+"(select class_id   from mp_grade_section where grade_id=(select grade_id "+"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"')) and "+"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' and id not in(select student_id from tr_term_physical_education where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforphysical-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,interest_area,identified_talent,member_of_school,competitions_attended,prize_won from tr_term_physical_education where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' order by student_name";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



app.post('/fetchstudentforartverticals-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' and id not in(select student_id from tr_term_art_verticals where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"') order by student_name";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforartverticals-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,interest_area,identified_talent,member_of_school,competitions_attended,prize_won from tr_term_art_verticals where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentreportforhealth-service',  urlencodedParser,function (req, res)
{
  var qur="select distinct(student_id) as id,student_name,grade,section,height,weight,blood_group,vision_left,vision_right,dental from tr_term_health where  term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' order by student_name";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchstudentreportforhealth1-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id,student_name,grade,section,height,weight,blood_group,vision_left,vision_right,dental from tr_term_health where student_id='"+req.query.studentid+"'and term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' order by student_name";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/getinmailinfo-service',  urlencodedParser,function (req, res)
{
 var qur="select * from tr_student_varified_table v  join parent p on(v.student_id=p.student_id) where v.school_id='"+req.query.schoolid+"' and p.school_id='"+req.query.schoolid+"' and v.academic_year='"+req.query.academicyear+"' and p.academic_year='"+req.query.academicyear+"' and v.grade_name='"+req.query.grade+"' and v.section_name='"+req.query.section+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchstudbeginnerreport-service',  urlencodedParser,function (req, res)
{
  var qur="select *,(select student_name from md_student where id=student_id and school_id='"+req.query.schoolid+"' "+
  "and academic_year='"+req.query.academicyear+"') as student_name "+
  "from tr_beginner_assesment_marks where class_id=(select class_id  from mp_grade_section "+
  "where grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') "+
  "and section_id=(select section_id from md_section where section_name='"+req.query.section+"' "+
  "and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' "+
  "and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' "+
  "and academic_year='"+req.query.academicyear+"' and "+
  "subject_id='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"'";
  console.log('----------------------------------------------------');
  console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetching student info
app.post('/fetchstudent-service',  urlencodedParser,function (req, res)
{
var qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
"grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
" and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in(0,1)";
var qur="select * from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')  and flag='active' order by student_name";
var qur1="select school_id,student_id as id,student_name,class_id "+
"from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')  and flag='active' order by student_name";
var qur2="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')  and flag='active' order by student_name";

  console.log(qurcheck);
  console.log('............................................'); 
  console.log(qur);
  console.log('............................................'); 
  console.log(qur1); 
  console.log('............................................'); 
  console.log(qur2); 


connection.query(qurcheck,function(err, rows){
  //console.log(rows.length);
if(rows.length==0){
connection.query(qur,
  function(err, rows)
  {
    if(!err)
    {
      if(rows.length>0)
      {
        //console.log('qur1...............................');
       connection.query(qur1,function(err, rows)
       {
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else{
        console.log(err);
        res.status(200).json({'returnval': 'invalid'});
       }
      });
      }
      else
      {
       connection.query(qur2,function(err, rows){
        console.log('............normal subject............'); 
        console.log(qur2);     
        console.log('............................................'); 
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else{
        console.log(err);
        res.status(200).json({'returnval': 'invalid'});
      }
      });
      }
    }
    else
      console.log(err);
  
});

}
else
res.status(200).json({'returnval': 'imported'});
});

});


app.post('/fetchfastudent-service',  urlencodedParser,function (req, res)
{
  console.log('sa');
  var qur="select * from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"') and flag='active'";
var qur1="select school_id,student_id as id,student_name,class_id "+
"from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"') and flag='active'";
  var qur2="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"') and flag='active'";

connection.query(qur,
  function(err, rows)
  {
    if(!err)
    {
      if(rows.length>0)
      {
       connection.query(qur1,function(err, rows)
       {
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else
        res.status(200).json({'returnval': 'invalid'});
      });
      }
      else
      {
     connection.query(qur2,function(err, rows)
     {
        console.log('............normal subject............'); 
        console.log(qur2);     
        console.log('............................................'); 
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else{
        console.log(err);
        res.status(200).json({'returnval': 'invalid'});
      }
       });
    }
  }
    else
      console.log(err);
  
}); 

});


// fetchmarkexiststudentinfo-service

//Storing marks for assesment
app.post('/insertbamark-service',urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,   
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         assesment_type:req.query.assesmenttype,
         class_id:req.query.classid,
         grade_id:req.query.gradename,
         section_id:req.query.sectionid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,
         subject_id:req.query.subjectid,
         subject_name:req.query.subjectname,
         category_id:req.query.categoryid,
         category_name:req.query.categoryname,
         sub_category_id:req.query.subcategoryid,
         sub_category_name:req.query.subcategoryname,
         score:req.query.score,
         grade:req.query.grade,
         level:req.query.category,
         enrich_level:req.query.enrichlevel,
         speed_level:req.query.speedlevel,
         comprehension_level:req.query.comprehensionlevel
  }
  var updateres={
    score:req.query.score,
    grade:req.query.grade,
    level:req.query.category,
    enrich_level:req.query.enrichlevel,
    speed_level:req.query.speedlevel,
    comprehension_level:req.query.comprehensionlevel
  };
  var checkqur="SELECT * FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and  subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"' and sub_category_id='"+req.query.subcategoryid+"' and "+
  "class_id='"+req.query.classid+"' and student_id='"+req.query.studentid+"' and assesment_type='"+req.query.assesmenttype+"'";
  var updatequr="UPDATE tr_beginner_assesment_marks SET ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and assesment_type='"+req.query.assesmentid+"' and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"' and sub_category_id='"+req.query.subcategoryid+"' and "+
  "class_id='"+req.query.classid+"' and student_id='"+req.query.studentid+"'";
  console.log('.............................checkqur.............................');
  console.log(checkqur);
  console.log('..................................................................');
  console.log(response);
  console.log('----------------------------------------------------------------');
  console.log(updatequr);
  connection.query(checkqur,function(err, rows)
    {
    if(!err){
    if(rows.length>0){
    connection.query(updatequr,[updateres],function(err, rows){
    if(!err)
      res.status(200).json({'returnval': 'succ'});
    else
      res.status(200).json({'returnval': 'fail'});
    });
    }
    else{
    connection.query("INSERT INTO tr_beginner_assesment_marks set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
    });
    }
    }
    else
      console.log(err);
    });
});


app.post('/fetchbeginnermarksforgrade-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
  " academic_year='"+req.query.academicyear+"' and assesment_type='"+req.query.assesmentname+"' and"+
  " grade_id='"+req.query.grade+"' and section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"'";
  console.log('------Fetch beginner mark------');
  console.log(qur);
  console.log('-------------------------------');
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {  
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
});


app.post('/fetchgrade-service', urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchfagrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_fa_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});




app.post('/fetchcoscholasticgrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_coscholastic_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));  
      global.coscholasticgrade=rows; 
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
//Storing marks for assesment
app.post('/insertassesmentmark-service',  urlencodedParser,function (req, res)
{ 
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,   
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,
         sub_category:req.query.subcategory,
         mark:req.query.mark,
         flag:req.query.absflag,
         sub_cat_sequence:req.query.subcatseq                 
  }
  var cond1={school_id:req.query.schoolid};
  var cond2={academic_year:req.query.academicyear};
  var cond3={assesment_id:req.query.assesmentid};
  var cond4={term_name:req.query.termname};
  var cond5={class_id:req.query.classid};
  var cond6={student_id:req.query.studentid};
  var cond7={subject_id:req.query.subject};
  var cond8={category:req.query.category};
  var cond9={sub_category:req.query.subcategory};
  var cond10={grade:req.query.grade};
  var cond11={section:req.query.section};
  var cond12={sub_cat_sequence:req.query.subcatseq};
  var subname={subject_name:req.query.subject};
  var mark={mark:req.query.mark};
  

  //console.log(response);

  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;
 
  var q="SELECT * FROM tr_term_assesment_marks WHERE grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmentid+"' and term_name='"+req.query.termname+"' "+
  " and student_id='"+req.query.studentid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"' and sub_cat_sequence='"+req.query.subcatseq+"'";
  console.log('..................................');
  console.log(q);
  console.log('..................................');
  connection.query("SELECT * FROM tr_term_assesment_marks WHERE ? and ? and ? and ? and ? and ? and ? and ? and ? and ? and ? ",[cond1,cond2,cond3,cond4,cond6,cond7,cond8,cond9,cond10,cond11,cond12],function(err, rows) {
  console.log("length..........."+rows.length);
  if(rows.length==0){
  connection.query("INSERT INTO tr_term_assesment_marks set ?",[response],
  function(err, result)
    {
    if(!err)
    {  
     console.log("rows affected............"+result.affectedRows);  
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
  else{
   connection.query("UPDATE tr_term_assesment_marks SET ? WHERE ? and ? and ? and ? and ? and ? and ? and ? ",[mark,cond1,cond2,cond3,cond4,cond6,cond7,cond8,cond9],function(err, rows) {
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
 
});
});
});

//Storing overall marks for the assesment
app.post('/overalltermmarkinsert-service',  urlencodedParser,function (req, res){

  var qur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
  "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";
  var checkqur="SELECT * FROM tr_term_assesment_overall_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'";
  var updatequr="Update tr_term_assesment_overall_marks o SET total=(SELECT sum(mark) as total from tr_term_assesment_marks t where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and t.category=o.category group by category), "+
  " rtotal=(SELECT sum(mark)/count(*) as rtotal from tr_term_assesment_marks t where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and o.category=t.category group by category) "+
  " WHERE academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'";
  var insertqur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' "+
  "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";
  console.log('-------------------------');
  console.log(req.query.role); 
   if(req.query.role=='Co-Ordinator'){
  console.log('----------overall insert-----------');
  console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
  else{
  console.log('----------overall insert-----------');
  console.log(checkqur);
  console.log('----------overall insert-----------');
  console.log(updatequr);
  connection.query(checkqur,function(err, rows){
    if(!err)
    {   
    if(rows.length>0){
    connection.query(updatequr,function(err, rows){ 
      if(!err)
      res.status(200).json({'returnval': 'succ'});
    else
      console.log(err);
    });
    }
    else{
    connection.query(insertqur,function(err, rows){ 
      if(!err)
      res.status(200).json({'returnval': 'succ'});
    else
      console.log(err);
    }); 
    }
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
});



app.post('/insertfaassesmentmark-service',  urlencodedParser,function (req, res)
{ 
  console.log('fa insert');
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,   
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,
         sub_category:req.query.subcategory,
         mark:req.query.mark,
         flag:req.query.absflag,
         sub_cat_sequence:req.query.subcatseq                 
  }
  var cond1={school_id:req.query.schoolid};
  var cond2={academic_year:req.query.academicyear};
  var cond3={assesment_id:req.query.assesmentid};
  var cond4={term_name:req.query.termname};
  var cond5={class_id:req.query.classid};
  var cond6={student_id:req.query.studentid};
  var cond7={subject_id:req.query.subject};
  var cond8={category:req.query.category};
  var cond9={sub_category:req.query.subcategory};
  var cond10={grade:req.query.grade};
  var cond11={section:req.query.section};
  var cond12={sub_cat_sequence:req.query.subcatseq};
  var subname={subject_name:req.query.subject};
  var mark={mark:req.query.mark};
  

  //console.log(response);

  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;
 console.log(response.subject_category);

  var q="SELECT * FROM tr_term_fa_assesment_marks WHERE grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'"+
  " and term_name='"+req.query.termname+"' and class_id='"+req.query.classid+"'"+
  " and student_id='"+req.query.studentid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"' and sub_cat_sequence='"+req.query.subcatseq+"'";
 console.log('..................................');
  console.log(q);
  console.log('..................................');
  connection.query("SELECT * FROM tr_term_fa_assesment_marks WHERE ? and ? and ? and ? and ? and ? and ? and ? and ? and ? and ? ",[cond1,cond2,cond3,cond4,cond6,cond7,cond8,cond9,cond10,cond11,cond12],function(err, rows) {
  if(!err){
 console.log("length..........."+rows.length);
  if(rows.length==0){
  connection.query("INSERT INTO tr_term_fa_assesment_marks set ?",[response],
  function(err, result)
    {
    if(!err)
    {  
     console.log("rows affected............"+result.affectedRows);  
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
  else{
   connection.query("UPDATE tr_term_fa_assesment_marks SET ? WHERE ? and ? and ? and ? and ? and ? and ?",[mark,cond1,cond2,cond4,cond6,cond7,cond8,cond9],function(err, rows) {
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
  }
  else
  console.log(err);
    // res.status(200).json({'returnval': 'Duplicate entry!'});
  // });
});
});
});

//Storing overall marks for the assesment
// app.post('/overalltermmarkinsert-service',  urlencodedParser,function (req, res){

//   var qur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
//   "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
//   "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
//   "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
//   "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";

//   connection.query(qur,
//   function(err, rows){
//      if(!err)
//     {    
//       res.status(200).json({'returnval': 'succ'});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'fail'});
//     }
//   });
// });

app.post('/fnoverallmarks1-service',  urlencodedParser,function (req, res){

  var qur="SELECT school_id,academic_year,"+
"term_name,student_id,subject_id,category,sum(rtotal) as total,"+ 
"sum(rtotal)/count(*) as average,"+
"(SELECT grade from md_grade_rating where lower_limit<=round((sum(rtotal)/count(*)),1) && higher_limit>=round((sum(rtotal)/count(*)),1)) as term_cat_grade,grade,section from tr_term_assesment_overall_marks where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"'  and  student_id='"+req.query.studentid+"'and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
"group by school_id,academic_year,term_name,subject_id,category,student_id";

console.log(qur);

connection.query(qur,function(err, rows){

     if(!err) {  
for(var i=0;i<rows.length;i++){

   var qur2="update tr_term_assesment_overall_assesmentmarks set total='"+rows[i].total+"',rtotal='"+rows[i].average+"',term_cat_grade='"+rows[i].term_cat_grade+"' where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"'"+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'   and  category='"+rows[i].category+"' and  student_id='"+req.query.studentid+"'";
console.log("---------------");
console.log(qur2);
console.log("---------------");
   connection.query(qur2, function(err, rows){
 
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
});

app.post('/fnoverallmarks-service',  urlencodedParser,function (req, res){

var qur3="SELECT sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal ,school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and  student_id='"+req.query.studentid+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id"; 

var q="select * from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"' and  grade='"+req.query.grade+"' and section='"+req.query.section+"'  and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesmentid+"'";
 // console.log("---------------");  
  //console.log(qur3);  
 connection.query(q,function(err, rows)
    {
   //console.log(rows.length);
    if(rows.length==0){
  connection.query("INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'"+
  "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id",function(err, rows)
    {
    if(!err)
    {    
      //console.log('insert');
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
 }
 else
  {
 connection.query(qur3,function(err, rows){
 console.log("comming");

  if(!err){
     for(var i=0;i<rows.length;i++)
      {
console.log(".......................................");
console.log("update tr_term_assesment_overall_marks set total='"+rows[i].total+"',rtotal='"+rows[i].rtotal+"' where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'"+"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and  student_id='"+req.query.studentid+"' and category='"+rows[i].category+"'");
console.log(".......................................");


  connection.query("update tr_term_assesment_overall_marks set total='"+rows[i].total+"',rtotal='"+rows[i].rtotal+"' where academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'"+"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and  student_id='"+req.query.studentid+"' and category='"+rows[i].category+"'",function(err, rows){
 
  if(!err)
      {    
       res.status(200).json({'returnval': 'succ'});
      }
         else
       {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
        }
     });

   }

   }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   });
   
  }
});
});

// app.post('/overalltermmarkinsert-service',  urlencodedParser,function (req, res){

//   var qur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
//   "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
//   "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
//   "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
//   "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";

//   connection.query(qur,
//   function(err, rows){
//      if(!err)
//     {    
//       res.status(200).json({'returnval': 'succ'});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'fail'});
//     }
//   });
// });

//storing overall scholastic mark
app.post('/overalltermassesmentinsert-service',  urlencodedParser,function (req, res){

var qur=" INSERT INTO tr_term_assesment_overall_assesmentmarks SELECT school_id,academic_year,"+
"term_name,student_id,subject_id,category,sum(rtotal) as total,"+ 
"sum(rtotal)/count(*) as average,"+
"(SELECT grade from md_grade_rating where lower_limit<=round((sum(rtotal)/count(*)),1) && higher_limit>=round((sum(rtotal)/count(*)),1)) as term_cat_grade,grade,section from tr_term_assesment_overall_marks where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
"group by school_id,academic_year,term_name,subject_id,category,student_id";
var checkqur="SELECT * FROM tr_term_assesment_overall_assesmentmarks WHERE academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'";
var updatequr="UPDATE tr_term_assesment_overall_assesmentmarks o SET total=(SELECT sum(rtotal) as total from tr_term_assesment_overall_marks t where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and o.category=t.category group by category) "+
" ,rtotal=(SELECT sum(rtotal)/count(*) as average from tr_term_assesment_overall_marks t  where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and o.category=t.category group by category) "+
" ,term_cat_grade=(SELECT (SELECT grade from md_grade_rating where lower_limit<=round((sum(rtotal)/count(*)),1) && higher_limit>=round((sum(rtotal)/count(*)),1)) as term_cat_grade from tr_term_assesment_overall_marks t where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and o.category=t.category group by category) "+
" WHERE academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'"; 
var insertqur=" INSERT INTO tr_term_assesment_overall_assesmentmarks SELECT school_id,academic_year,"+
"term_name,student_id,subject_id,category,sum(rtotal) as total,"+ 
"sum(rtotal)/count(*) as average,"+
"(SELECT grade from md_grade_rating where lower_limit<=round((sum(rtotal)/count(*)),1) && higher_limit>=round((sum(rtotal)/count(*)),1)) as term_cat_grade,grade,section from tr_term_assesment_overall_marks where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and student_id='"+req.query.studentid+"'"+
"group by school_id,academic_year,term_name,subject_id,category,student_id";
  console.log('--------------overall asses insert----------------------');
  console.log(req.query.role);

  if(req.query.role=="Co-Ordinator"){
  console.log('--------------overall asses insert----------------------');
  console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });  
  }
  else{    
  console.log('--------------overall asses insert----------------------');
  console.log(checkqur);
  console.log('--------------overall asses insert----------------------');
  console.log(updatequr);
    connection.query(checkqur,function(err, rows){
    if(!err)
    {  
    if(rows.length>0){
    connection.query(updatequr,function(err, rows){
    if(!err)
    {  
      res.status(200).json({'returnval': 'succ'});
    }
    else
      console.log(err);
    });
    }
    else
    {
    connection.query(insertqur,function(err, rows){
    if(!err)
    {  
      res.status(200).json({'returnval': 'succ'});
    }
    else
      console.log(err);
    });  
    }
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  }); 
  }
});

//storing mark for coscholastic assessment
app.post('/insertcoassesmentmark-service',  urlencodedParser,function (req, res)
{

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         grade:req.query.grade,
         section:req.query.section,         
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:req.query.categorygrade,
         sub_seq:req.query.sequence
   }  
   console.log(response);
   var q="select * from tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"' and  subject_id='"+req.query.subject+"' and  sub_category='"+req.query.subcategory+"'";
  connection.query(q,
 function(err, rows)
    {
    if(rows.length==0)
    {
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;  
  connection.query("INSERT INTO tr_coscholastic_assesment_marks set ?",[response],
  function(err, rows)
    {
     // console.log('co-insert');
    if(!err)
    {    
      //console.log('co1-insert');
      res.status(200).json({'returnval': 'insert'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  });
}
else
{
  
  connection.query("UPDATE tr_coscholastic_assesment_marks SET ? where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"' and  subject_id='"+req.query.subject+"' and  sub_category='"+req.query.subcategory+"'",[response],
    function(err, rows)
     {
    
    if(!err)
    {
      console.log('co1-update');
      res.status(200).json({'returnval': 'update'});
    }
    else
    {
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
}
});

});

app.post('/insertcosubcategorymark-service',  urlencodedParser,function (req, res){

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assessment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studid,
         student_name:req.query.studname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,        
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:"",
         order_seq:req.query.order_seq

  }  
  var q="select * from tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studid+"' and  subject_id='"+req.query.subject+"' and  category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"'  order by order_seq";
  //console.log(q);  
  connection.query(q,
 function(err, rows)
    {
 // console.log(rows.length);
    if(rows.length==0){
  connection.query("INSERT INTO tr_coscholastic_sub_category_assesment_marks set ?",[response],
  function(err, rows)
    {
    if(!err)
    {    
      //console.log('insert');
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
}
  else
  {
   connection.query("UPDATE tr_coscholastic_sub_category_assesment_marks SET ? where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studid+"' and  subject_id='"+req.query.subject+"' and  category='"+req.query.category+"'and sub_category='"+req.query.subcategory+"'",[response],
    function(err, rows) {
     // console.log("update");
    if(!err){
      //console.log("success");
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
});
});
//storing overall coscholastic mark
app.post('/overallinsertcoassesment-service',  urlencodedParser,function (req, res){
   var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,         
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         subject_id:req.query.subject,
         type:req.query.type,
         category:req.query.category,         
         total:req.query.total,
         rtotal:req.query.rtotal,
         grade:req.query.grade                
  }
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category; 
  connection.query("INSERT INTO tr_term_co_assesment_overall_marks set ?",[response],
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  
  });
  });
});

//storing mark for coscholastic assessment
app.post('/insertcocurricularmark-service',  urlencodedParser,function (req, res){

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assessment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         grade:req.query.grade,
         section:req.query.section,         
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:req.query.categorygrade
  }  
  
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {  
  response.subject_category=rows[0].subject_category;
  
  connection.query("INSERT INTO tr_cocurricular_term_marks set ?",[response],
  function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  });
});

//storing overall coscholastic mark
app.post('/overallinsertcocurricularmark-service',  urlencodedParser,function (req, res){
   var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,         
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         subject_id:req.query.subject,
         type:req.query.type,
         category:req.query.category,         
         total:req.query.total,
         rtotal:req.query.rtotal,
         grade:req.query.grade                
  }
  var subname={subject_name:req.query.subject};  
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category; 
  connection.query("INSERT INTO tr_cocurricular_overallterm_marks set ?",[response],
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  
  });
  });
});

app.post('/scorecardreadyness-service',  urlencodedParser,function (req,res)
{
  var qur1="select count(assesment_name) as count from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) where s.school_id='"+req.query.schoolid+"' and "+
  " g.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
  " g.term_name='"+req.query.termname+"' and s.grade_id='"+req.query.gradeid+"' and g.grade_id='"+req.query.gradeid+"' and sub.type='Each' and sub.language_pref not in ('Second Language','Third Language')";
  var qur5="select count(assesment_name) as count from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) where s.school_id='"+req.query.schoolid+"' and "+
  " g.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
  " g.term_name='"+req.query.termname+"' and s.grade_id='"+req.query.gradeid+"' and g.grade_id='"+req.query.gradeid+"' and sub.type='Each' and sub.subject_id in(select distinct(subject_id) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and grade='"+req.query.gradeid+"' and section='"+req.query.section+"')";
  var qur2="select count(distinct(s.subject_id)) as count from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) where s.school_id='"+req.query.schoolid+"' and "+
  " g.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
  " g.term_name='"+req.query.termname+"' and s.grade_id='"+req.query.gradeid+"' and g.grade_id='"+req.query.gradeid+"' and sub.type='Once' and sub.subject_id!='s14'";
  var qur3="select school_id,term_name,assesment_id,grade,section,subject from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and flag='1' group by school_id,term_name,assesment_id,grade,section,subject";
  var qur4="select school_id,term_name,assesment_id,grade,section,subject from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and flag='1' group by school_id,term_name,assesment_id,grade,section,subject";

  var count1=0,count2=0,count3=0;
  console.log("-----------------------SUB-");

  var qur6="SELECT count(distinct(subject_id)) as count FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
  var qur7="select count(distinct(s.subject_id)) as count from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) where s.school_id='"+req.query.schoolid+"' and "+
  " g.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
  " g.term_name='"+req.query.termname+"' and s.grade_id='"+req.query.gradeid+"' and g.grade_id='"+req.query.gradeid+"' and sub.type='Once' and sub.subject_id not in('s14','s15')";
  
  var count1=0,count2=0,count3=0,count4=0,count5=0;

  console.log(qur1);
  console.log("--------------");
  console.log(qur2);
  console.log("--------------");
  console.log(qur3);
  console.log("-------------------");
  console.log(qur4);
  console.log(qur5);
  console.log(qur6);
  console.log(qur7);
  if(req.query.gradeid=="g1"||req.query.gradeid=="g2"||req.query.gradeid=="g3"||req.query.gradeid=="g4")
  {
    connection.query(qur1,function(err, rows)
    {
    if(!err)
    { 
     if(rows.length>0)
     count1=rows[0].count;
     connection.query(qur2,function(err, rows)
     {
     if(!err)
     {
     if(rows.length>0)
     count2=rows[0].count;
     connection.query(qur3,function(err, rows)
     {
     if(!err)
     {
      if(rows.length>0)
      count3=rows.length;
     connection.query(qur5,function(err, rows)
     {
     if(!err)
     {
      if(rows.length>0)
      count4=rows[0].count;
      console.log(count1+" "+count2+" "+count3+" "+count4);
      if((parseInt(count1)+parseInt(count2)+parseInt(count4))==parseInt(count3))
      res.status(200).json({'returnval': 'match'});
      else
      res.status(200).json({'returnval': 'nomatch'});
     }
     else
      console.log(err+1);
     });
     }
     else
      console.log(err+2);
     });
     }
     else
      console.log(err+3);
     });
    }
    else
      console.log(err+4);
    });
  }
  else{
    connection.query(qur1,function(err, rows)
    {
    if(!err)
    { 
     if(rows.length>0)
     count1=rows[0].count;
     connection.query(qur7,function(err, rows)
     {
     if(!err)
     {
      if(rows.length>0)
      count2=rows[0].count;
      connection.query(qur4,function(err, rows)
      {
      if(!err)
      {
      if(rows.length>0)
      count3=rows.length;
    connection.query(qur5,function(err, rows)
     {
     if(!err)
     {
      if(rows.length>0)
      count4=rows[0].count;
    // connection.query(qur6,function(err, rows)
    //  {
    //  if(!err)
    //  {
    //   if(rows.length>0)
    //   count5=rows[0].count;
      console.log(count1+" "+count2+" "+count3+" "+count4+" "+count5);
      if((parseInt(count1)+parseInt(count2)+parseInt(count4))==parseInt(count3)+parseInt(count5))
      res.status(200).json({'returnval': 'match'});
      else
      res.status(200).json({'returnval': 'nomatch'});
     // }
     // else
     //  console.log(err);
     // });
     }
     else
      console.log(err);
     });
      }
      });
     }
     });
    }
    });
  }
});

// //fetching student names
// app.post('/scorecardreadyness-service',  urlencodedParser,function (req,res)
// {   
// //console.log('-------------------------------');
// //console.log(req.query.termname);
// //console.log('-------------------------------');
// var n=0;
// console.log('--------------------'+req.query.termname+'-----------');

// if(req.query.termname=='Term1'||req.query.termname=='Quartely')
// n=1;
// if(req.query.termname=='Term2'||req.query.termname=='Half Yearly')
// n=2;
// if(req.query.termname=='Term3'||req.query.termname=='Pre-Annual')
// n=3;
// if(req.query.grade=="Grade-1"||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4"){
// var qur="select * from md_grade_subject_count where no_of_subjects=(( "+
// "(select count(distinct(subject_id)) from tr_term_assesment_overall_assesmentmarks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')*("+n+"))/"+
// "(select count(distinct(term_name)) from tr_term_assesment_overall_assesmentmarks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')) and school_id='"+req.query.schoolid+"' and "+
// "academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
// }
// else
// {
// if(req.query.academicyear=='2016-2017')
// var qur="select * from md_grade_subject_count where no_of_subjects=(( "+
// "(select count(distinct(subject_id)) from tr_term_overallfa_assesment_marks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')*("+n+"))/"+
// "(select count(distinct(term_name)) from tr_term_overallfa_assesment_marks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')) and school_id='"+req.query.schoolid+"' and "+
// "academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
// else
// var qur="select * from md_grade_subject_count where no_of_subjects=(( "+
// "(select count(distinct(subject_id)) from tr_term_fa_assesment_marks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')*("+n+"))/"+
// "(select count(distinct(term_name)) from tr_term_fa_assesment_marks where "+
// "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
// "grade='"+req.query.grade+"' and section='"+req.query.section+"')) and school_id='"+req.query.schoolid+"' and "+
// "academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
// }
// console.log('.........................score card-----------------------------------');
// console.log(qur);

//   connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {  
//       if(rows.length>0)
//       res.status(200).json({'returnval': 'match'});
//       else
//       res.status(200).json({'returnval': 'mismatch'});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'fail'});
//     }  

//   });
// });


//fetching student names
app.post('/fetchstudname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var gradeid={grade_id:req.query.grade};
  var sectionid={section_id:req.query.section};

  // var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
  var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active'";

   var qur1="select * from tr_student_varified_table where school_id='"+req.query.schoolid+"' and "+
    "grade_name='"+req.query.grade+"' and section_name='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_id='"+req.query.termname+"'";

  console.log(qur);
  var  verifyarr=[];
  connection.query(qur1, function(err, rows){
    if(!err)
    {  
      verifyarr=rows;
     connection.query(qur, function(err, rows){
    if(!err)
    {  
      res.status(200).json({'returnval': rows,'verifyarr':verifyarr});
    }
    });
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

});     

//fetch the Life SKill SUb category
app.post('/fetchlifeskill',  urlencodedParser,function (req,res)
{  
  var type=req.query.termtype;
   // console.log(type);
    // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
 console.log("SELECT * FROM md_coscholastic_metrics where sub_category='"+req.query.termtype+"' and school_id='"+req.query.schoolid+"'and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"'");

  connection.query( "SELECT * FROM md_coscholastic_metrics where sub_category='"+req.query.termtype+"' and school_id='"+req.query.schoolid+"'and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"'",
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentlifeskill',  urlencodedParser,function (req,res)
{  
  var type=req.query.termtype;
 var qur= "SELECT sub_category,mark FROM tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studid+"'and category='"+req.query.subcategory+"' order by order_seq";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});

app.post('/fngetsubject-service',  urlencodedParser,function (req,res)
{  
 var qur= "select * from md_subject where subject_category='"+req.query.category+"'and subject_name in(select distinct(subject) from single_student_markentry_table where subject_category='"+req.query.category+"' and academic_year='"+req.query.academic_year+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"'   and section='"+req.query.sectionname+"' and student_id='"+req.query.studentid+"'and flag='completed')";
  console.log("==============================");
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});
app.post('/getsection-service',  urlencodedParser,function (req,res)
{  
 var qur= "select grade_id as gradeid,class_id as classid,(select grade_name from md_grade where grade_id=gradeid) as gradename,(select section_id from mp_grade_section where class_id=classid and academic_year='"+req.query.academic_year+"' and school_id='"+req.query.schoolid+"') as sectionname from md_student where id='"+req.query.stuid+"' and academic_year='"+req.query.academic_year+"' and school_id='"+req.query.schoolid+"'";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows,'studentid':req.query.stuid});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});

app.post('/fetchcategory-service',  urlencodedParser,function (req,res)
{  
 var qur= "select * from md_category_type where category_type in(select subject_category from single_student_markentry_table where school_id='"+req.query.schoolid+"' and "+
 " academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and"+
 " section='"+req.query.sectionname+"' and student_id='"+req.query.studentid+"')";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});

//fetching student info
app.post('/fetchstudinfo-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={id:req.query.studid};
  var qur="select s.id,p.student_id,s.student_name,s.dob,p.parent_name,p.mother_name,p.email,p.mobile,p.address1,p.address2,p.address3,p.city,p.pincode,p.alternate_mail "+
  "from md_student s join parent p on(s.id=p.student_id) and s.id='"+req.query.studid+"' and s.school_id='"+req.query.schoolid+"' and s.flag='active' and p.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and p.academic_year='"+req.query.academicyear+"'";
   var qur1 ="select UPPER(id) as id,UPPER(school_id) as school_id from  mp_teacher_grade where school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"')  and role_id='class-teacher'  and section_id='"+req.query.section+"' and flage='active'";

var emparr=[];
  console.log("------------stuinfo------------");
  console.log(qur);
  console.log(qur1);
  console.log("-------------------------------");

  connection.query(qur1, function(err, rows)
    {
    if(!err)
    {   
    emparr=rows;   
    connection.query(qur, function(err, rows)
    {
    if(!err)
    {       
      global.studentinfo=rows; 
      console.log(rows);
      res.status(200).json({'returnval': rows,'emparr':emparr});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
   });
    }  
   });
});

//fetching subject info
app.post('/fetchsubjectname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};
  // var qur="select subject_id,subject_name,subject_category from md_subject where subject_id in"+
  // "(select subject_id from mp_grade_subject where grade_id="+
  // "(select grade_id from mp_grade_section where class_id="+
  // "(select class_id from md_student where id='"+req.query.studid+"' "+
  // "and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"')) order by subject_category";
  var qur="select subject_id,subject_name,subject_category from md_subject where subject_id in"+
  "(select subject_id from mp_grade_subject where grade_id="+
  "(select grade_id from mp_grade_section where class_id="+
  "(select class_id from md_student where id='"+req.query.studid+"' "+
  "and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') order by subject_category";
console.log('------------fetching subjects-----------');
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.subjectinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


//fetching subject info
app.post('/fetchreportsubjectname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var grade={grade:req.query.grade};
  var section={section:req.query.section};
  var qur="select subject_id,subject_name,subject_category from md_subject where subject_id in "+
  "(select subject_id from mp_grade_subject where grade_id=(select grade_id from "+
  "md_grade where grade_name='"+req.query.grade+"')) "+
  " order by subject_category";
  console.log('----------fetchreportsubjectname------------');
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.subjectinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var qur="SELECT * FROM tr_term_overallfa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND student_id='"+req.query.studid+"' and term_name in(select term_name from md_term "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'))order by subject_id";

  console.log('----------------------fetch mark------------------------');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    { 
    if(!err)
    {       
      global.fetchmark=rows;
      // console.log('---------------------------');
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

//fetchscholasticmark-service
app.post('/fetchscholasticmark-service',  urlencodedParser,function (req,res)
{   
   var schoolid={school_id:req.query.schoolid};
   var studid={student_id:req.query.studid}; 
   var academicyear={academic_year:req.query.academicyear};  
   var qur="SELECT * FROM tr_term_assesment_overall_assesmentmarks am join "+
  " md_grade_descriptor gd on(am.category=gd.category_check) WHERE school_id='"+req.query.schoolid+"' "+
  " AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studid+"' and am.term_cat_grade=gd.grade and "+
  " am.subject_id=gd.subject_name and term_name in(select term_name from md_term "+
  " where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) ";
  console.log('.........................Score card....................................');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.scholasticinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

//fetchcoscholasticmark-service
app.post('/fetchcoscholasticmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  

  connection.query("SELECT * FROM tr_term_co_assesment_overall_marks WHERE ? AND ? AND ? order by subject_id",[studid,schoolid,academicyear],
    function(err, rows)
    {
    if(!err)
    {
      global.coscholasticinfo=rows;       
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetchcocurricularmark-service
app.post('/fetchcocurricularmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};    

  connection.query("SELECT * FROM tr_cocurricular_overallterm_marks WHERE ? AND ? AND ? order by subject_id",[studid,schoolid,academicyear],
    function(err, rows)
    {
    if(!err)
    {  
      global.cocurricularinfo=rows;     
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
 app.post('/threetoeightvalues-service',  urlencodedParser,function (req,res)
 {   

     var studentid;
     var studentname;
     var fathername;
     var classs;
     var section;
     var dob;
     var staff="./app/images/"+req.query.staffid+req.query.schoolid+".jpg";
     var principalxx="./app/images/principal"+req.query.schoolid+".jpg";
     var classs=req.query.classs;
     var schoolid=req.query.schoolid;
     var section=req.query.section; 
     var academicyear=req.query.academicyear;  
     console.log(schoolid);
 
   for(i=0;i<global.studentpersonalinfo.length;i++){
    studentid=global.studentpersonalinfo[0].admission_no;
    studentname=global.studentpersonalinfo[0].student_name;
    fathername=global.studentpersonalinfo[0].father_name;
    dob=global.studentpersonalinfo[0].dob;
   
   }
    
     console.log(studentid);
     console.log(studentname);
     console.log(fathername);
     console.log(dob);
     console.log(section);
     console.log(classs);

 for(var i=0;i<global.assesmentarrs.length;i++){
          for(var j=0;j<global.masterarrs.length;j++){
               if((global.assesmentarrs[i].term_name).toLowerCase()==(global.masterarrs[j].term_name).toLowerCase()&&global.assesmentarrs[i].assesment_id==global.masterarrs[j].assesment_type&&global.assesmentarrs[i].grade==global.masterarrs[j].grade_name&&global.assesmentarrs[i].subject_id==global.masterarrs[j].subject_name){
              if((global.masterarrs[j].scale_type)=="/")
               global.assesmentarrs[i].score=parseFloat(parseFloat(global.assesmentarrs[i].total)/parseFloat(global.masterarrs[j].scalar)).toFixed(2);
              if((global.masterarrs[j].scale_type)=="*")
               global.assesmentarrs[i].score=parseFloat(parseFloat(global.assesmentarrs[i].total)*parseFloat(global.masterarrs[j].scalar)).toFixed(2);
              if((global.masterarrs[j].scale_type)=="/*")
               global.assesmentarrs[i].score=parseFloat((parseFloat(global.assesmentarrs[i].total)/parseFloat(global.masterarrs[j].actual_scale))*parseFloat(global.masterarrs[j].scalar)).toFixed(2);
            }
          }
        }
        var temparr=[];
        for(var i=0;i<global.subjectarrs.length;i++){
          var obj={};
          obj.subject=global.subjectarrs[i].subject_id;
          obj.PT1='';
          obj.NB1='';
          obj.SEA1='';
          obj.HY='';
          obj.mark1='';
          obj.grade1='';
          obj.PT2='';
          obj.NB2='';
          obj.SEA2='';
          obj.Y='';
          obj.mark2='';
          obj.grade2='';
          temparr.push(obj);
        }
        for(var i=0;i<global.assesmentarrs.length;i++){
          for(var j=0;j<temparr.length;j++){
          if(global.assesmentarrs[i].subject_id==temparr[j].subject){
  
         if(global.assesmentarrs[i].term_name=="Term1"){
            if((global.assesmentarrs[i].assesment_id).trim()=="Periodic Test1"){
    
                temparr[j].PT1=global.assesmentarrs[i].score;
            }
            if((global.assesmentarrs[i].assesment_id).trim()=="Note Book"){
              temparr[j].NB1=global.assesmentarrs[i].score;
            }
            if((global.assesmentarrs[i].assesment_id).trim()=="SEA1"){
              temparr[j].SEA1=global.assesmentarrs[i].score;
            }
            if((global.assesmentarrs[i].assesment_id).trim()=="Half Yearly"){
              temparr[j].HY=global.assesmentarrs[i].score;
            }
          }
          if(global.assesmentarrs[i].term_name=="Term2"){
            if(global.assesmentarrs[i].assesment_id=="Periodic Test2")
              temparr[j].PT2=global.assesmentarrs[i].score;
            if(global.assesmentarrs[i].assesment_id=="Note Book")
              temparr[j].NB2=global.assesmentarrs[i].score;
            if(global.assesmentarrs[i].assesment_id=="SEA2")
              temparr[j].SEA2=global.assesmentarrs[i].score;
            if(global.assesmentarrs[i].assesment_id=="Yearly")
              temparr[j].Y=global.assesmentarrs[i].score;
        
            }}}}
      for(var i=0;i<temparr.length;i++){
          if(temparr[i].PT1==""||temparr[i].PT1==null)
            temparr[i].PT1=0;
          if(temparr[i].NB1==""||temparr[i].NB1==null)
            temparr[i].NB1=0;
          if(temparr[i].SEA1==""||temparr[i].SEA1==null)
            temparr[i].SEA1=0;
          if(temparr[i].HY==""||temparr[i].HY==null)
            temparr[i].HY=0;
          temparr[i].mark1=parseFloat(parseFloat(temparr[i].PT1)+parseFloat(temparr[i].NB1)+parseFloat(temparr[i].SEA1)+parseFloat(temparr[i].HY)).toFixed(2);
          if(req.query.termname=="term2"){
          if(temparr[i].PT2==""||temparr[i].PT2==null)
            temparr[i].PT2=0;
          if(temparr[i].NB2==""||temparr[i].NB2==null)
            temparr[i].NB2=0;
          if(temparr[i].SEA2==""||temparr[i].SEA2==null)
            temparr[i].SEA2=0;
          if(temparr[i].Y==""||temparr[i].Y==null)
            temparr[i].Y=0;
          temparr[i].mark2=parseFloat(parseFloat(temparr[i].PT2)+parseFloat(temparr[i].NB2)+parseFloat(temparr[i].SEA2)+parseFloat(temparr[i].Y)).toFixed(2);
           }
          for(var n=0;n<global.gradearrs.length;n++){
            if(parseFloat(temparr[i].mark1)>=parseFloat(global.gradearrs[n].lower_limit)&&parseFloat(temparr[i].mark1)<=parseFloat(global.gradearrs[n].upper_limit))
              temparr[i].grade1=global.gradearrs[n].grade;
            if(req.query.termname=="term2"){
            if(parseFloat(temparr[i].mark2)>=parseFloat(global.gradearrs[n].lower_limit)&&parseFloat(temparr[i].mark2)<=parseFloat(global.gradearrs[n].upper_limit))
              temparr[i].grade2=global.gradearrs[n].grade;
            }
          }
        }

     for(var i=0;i<global.coarrsvalus.length;i++){
          for(var j=0;j<global.gradearrss.length;j++){
      if(parseFloat(global.coarrsvalus[i].total)>=parseFloat(global.gradearrss[j].lower_limit)&&parseFloat(global.coarrsvalus[i].total)<=parseFloat(global.gradearrss[j].higher_limit))
              global.coarrsvalus[i].grade=global.gradearrss[j].grade;
          }
        }
        var temp=[];
        var obj={};
        for(var i=0;i<global.coarrsvalus.length;i++){
          if(global.coarrsvalus[i].subject_id=="Discipline"){
            obj=global.coarrsvalus.splice(i,1);
             temp.push(obj);
          }
          }
         var headers1="<center><h2>REPORT CARD</h2></center>";

         var pesonalinfo1="<table ><tr><th style='text-align:left;'>Roll No: </th><th style='text-align: left;'>"+studentid+"</th></tr><tr><th style='text-align: left;'>Student’s Name: </th><th style='text-align: left;'>"+studentname+"</th></tr><tr><th style='text-align: left;'>Mother’s/Father’s/Guardian’s Name: </th><th style='text-align: left;'>"+fathername+"</th></tr><tr><th style='text-align: left;'>Date of birth: </th><th style='text-align: left;'>"+dob+"</th></tr><tr><th style='text-align: left;'>Class/Section: </th><th style='text-align: left;'>"+section+"/"+classs+"</th></tr></table><br><br>";

        var scolasticinformation1 ="<table style='border-collapse: collapse;' border='2'><tr> <th>Scholastic Areas</th><th colspan='6'>Term 1</th><th colspan='6'>Term 2</th></tr><tr><th>Subjects</th><th>Periodic Test1</th><th>NB1</th><th>SEA1</th><th>Half yearly exam</th><th>Marks (100)</th><th>Grade</th><th>Periodic Test1</th><th>NB1</th><th>SEA1</th><th>Yearly exam</th><th>Marks (100)</th><th>Grade</th></tr>"
        console.log(scolasticinformation1);
       for(var i=0;i<temparr.length;i++)
           {
   
            scolasticinformation1 +="<tr><td>"+temparr[i].subject+"</td><td>"+temparr[i].PT1+"</td><td>"+temparr[i].NB1+"</td><td>"+temparr[i].SEA1+"</td><td>"+temparr[i].HY+"</td><td>"+temparr[i].mark1+"</td><td>"+temparr[i].grade1+"</td><td>"+temparr[i].PT2+"</td><td>"+temparr[i].NB2+"</td><td>"+temparr[i].SEA2+"</td><td>"+temparr[i].Y+"</td><td>"+temparr[i].mark2+"</td><td>"+temparr[i].grade2+"</td></tr>"
          }
          scolasticinformation1 +="</table><br><br>";

         var coscolasticinformation1="<table class='tab1' style='border-collapse: collapse;' border='1'><tr><th style='text-align: left;'>Co scholastic Areas [on a 3 point A – C grading scale]</th><th style='text-align: left;'>Grade</th></tr>"
           for(var i=0;i<global.coarrsvalus.length;i++){

            coscolasticinformation1 +="<tr><td>"+global.coarrsvalus[i].subject_id+"</td><td>"+global.coarrsvalus[i].grade+"</td></tr>";
           }
           coscolasticinformation1 +="</table><br><br>";

          var gradingrate1 ="<table class='tab1' style='border-collapse: collapse;'border='1'><tr><th style='text-align: left;'>[A - E grading scale]</th><th style='text-align: left;'>Grade</th></tr>"
              for(var i=0;i<temp.length;i++){
             gradingrate1 +="<tr><td>"+temp[i].subject_id+"</td><td>"+temp[i].grade+"</td></tr>"    
              }
             
          
             gradingrate1 +="</table><br><br>";

            var results1="<table class='tab2'><tr><th style='text-align: left;'>Class Teacher's Remarks</th><th>"+req.query.remark+"</th></tr><tr><th style='text-align: left;'>Result</th><th>"+req.query.result+"</th></tr></table><br><br>";
           var  sinfnaturs1 ="<table style='width: 650px;margin-left:10px;'> <tr><th><center>"+req.query.date+"</center></th><th></th><th><center><img width='100px' height='45px' src="+staff+"></center></th><th></th><th><center><img  width='100px' height='45px' src="+principalxx+"></center></th><th></th></tr>"

            sinfnaturs1 +="<tr><th><center>Date</center></th><th></th><th><center>Signature of Class Teacher's</center></th><th></th><th><center>Signature of Principal</center></th><th></th></tr></table><br><br><br><br>";

        var ovaraltemplates1=headers1+pesonalinfo1+scolasticinformation1+coscolasticinformation1+gradingrate1+results1+sinfnaturs1;
 
       var finaloverall1="<div style='position: relative;width:700px;height: auto;border: 5px solid #849FDC;top:50px;left: 3px;'>"+ovaraltemplates1+"</div>";
  console.log("7");
 // console.log(finaloverall);
         htmlToPdf.convertHTMLString(finaloverall1, './app/reportcard/'+global.global.studentpersonalinfo[0].student_name+'.pdf',
    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
     //   logfile.write('pdf write:success\n\n');
        console.log('Converted');
 
    res.status(200).json({'returnval': 'converted'});     
    }
    });
 
});

app.post('/ntotenoverallvalus-service',  urlencodedParser,function (req,res)
 {   

var studentid;
var studentname;
var fathername;
var classs;
var section;
var dob;
        var staff="./app/images/"+req.query.staffid+req.query.schoolid+".jpg";
       var principalxx="./app/images/principal"+req.query.schoolid+".jpg";

     var classs=req.query.classs;
     var schoolid=req.query.schoolid;
     var section=req.query.section; 
     var academicyear=req.query.academicyear;  
     console.log(schoolid);
 
   for(i=0;i<global.studentpersonalinfo.length;i++){
    studentid=global.studentpersonalinfo[0].admission_no;
    studentname=global.studentpersonalinfo[0].student_name;
    fathername=global.studentpersonalinfo[0].father_name;
    dob=global.studentpersonalinfo[0].dob;
   
   }
    
     console.log(studentid);
     console.log(studentname);
     console.log(fathername);
     console.log(dob);
     console.log(section);
     console.log(classs);



        
        for(var i=0;i<global.assesmentarrs.length;i++){
          for(var j=0;j<global.masterarrs.length;j++){
            // alert(assesment[i].term_name+" "+master[j].term_name+" "+assesment[i].assesment_id+" "+master[j].assesment_type+" "+assesment[i].grade+" "+master[j].grade_name+" "+assesment[i].subject_id+" "+master[j].subject_name);
            if((global.assesmentarrs[i].term_name).toLowerCase()==(global.masterarrs[j].term_name).toLowerCase()&&global.assesmentarrs[i].assesment_id==global.masterarrs[j].assesment_type&&global.assesmentarrs[i].grade==global.masterarrs[j].grade_name&&global.assesmentarrs[i].subject_id==global.masterarrs[j].subject_name){
              // alert('in');
              if((global.masterarrs[j].scale_type)=="/")
               global.assesmentarrs[i].score=parseFloat(parseFloat(global.assesmentarrs[i].total)/parseFloat(global.masterarrs[j].scalar)).toFixed(2);
              if((global.masterarrs[j].scale_type)=="*")
               global.assesmentarrs[i].score=parseFloat(parseFloat(global.assesmentarrs[i].total)*parseFloat(global.masterarrs[j].scalar)).toFixed(2);
              if((global.masterarrs[j].scale_type)=="/*")
               global.assesmentarrs[i].score=parseFloat((parseFloat(global.assesmentarrs[i].total)/parseFloat(global.assesmentarrs[i].actual_scale))*parseFloat(global.masterarrs[j].scalar)).toFixed(2);
            }
          }
        } 

        // alert(JSON.stringify(assesment));
        var temparr=[];
        for(var i=0;i<global.subjectarrs.length;i++){
          var obj={};
          obj.subject=global.subjectarrs[i].subject_id;
          obj.PT1='';
          obj.NB1='';
          obj.SEA1='';
          obj.mark1='';
          obj.grade1='';
          obj.PT2='';
          obj.NB2='';
          obj.SEA2='';
          obj.mark2='';
          obj.grade2='';
          obj.PT3='';
          obj.NB3='';
          obj.SEA3='';
          obj.mark3='';
          obj.grade3='';
          temparr.push(obj);
        }
        for(var i=0;i<global.assesmentarrs.length;i++){
          for(var j=0;j<temparr.length;j++){
          if(global.assesmentarrs[i].subject_id==temparr[j].subject){
          if((global.assesmentarrs[i].term_name).toLowerCase()=="quartely"){
            if((global.assesmentarrs[i].assesment_id).trim()=="Periodic Test1"){
              temparr[j].MPT1=global.assesmentarrs[i].total;
              temparr[j].PT1=global.assesmentarrs[i].score;
            }
            if((global.assesmentarrs[i].assesment_id).trim()=="Note Book"){
              temparr[j].MNB1=global.assesmentarrs[i].total;
              temparr[j].NB1=global.assesmentarrs[i].score;
            }
            if((global.assesmentarrs[i].assesment_id).trim()=="SEA1"){
              temparr[j].MSEA1=global.assesmentarrs[i].total;
              temparr[j].SEA1=global.assesmentarrs[i].score;
            }
          }
          if((global.assesmentarrs[i].term_name).toLowerCase()=="halfyearly"){
            if(global.assesmentarrs[i].assesment_id=="Periodic Test2"){
              temparr[j].MPT1=global.assesmentarrs[i].total;
              temparr[j].PT1=global.assesmentarrs[i].score;
            }
            if(global.assesmentarrs[i].assesment_id=="Note Book"){
              temparr[j].MNB1=global.assesmentarrs[i].total;
              temparr[j].NB1=global.assesmentarrs[i].score;
            }
            if(global.assesmentarrs[i].assesment_id=="SEA2"){
              temparr[j].MSEA1=global.assesmentarrs[i].total;
              temparr[j].SEA1=global.assesmentarrs[i].score;
            }
          }
          if((global.assesmentarrs[i].term_name).toLowerCase()=="preannual"){
            if(assesment[i].assesment_id=="Periodic Test3"){
              temparr[j].MPT1=global.assesmentarrs[i].total;
              temparr[j].PT1=global.assesmentarrs[i].score;
            }
            if(global.assesmentarrs[i].assesment_id=="Note Book"){
              temparr[j].MNB1=global.assesmentarrs[i].total;
              temparr[j].NB1=global.assesmentarrs[i].score;
            }
            if(global.assesmentarrs[i].assesment_id=="SEA3"){
              temparr[j].MSEA1=global.assesmentarrs[i].total;
              temparr[j].SEA1=global.assesmentarrs[i].score;
            }
          }
          }
          }
          // alert(JSON.stringify(temparr));
        }
        // alert(JSON.stringify(temparr));
        for(var i=0;i<temparr.length;i++){
          if(temparr[i].MPT1==""||temparr[i].MPT1==null)
            temparr[i].MPT1=0;
          if(temparr[i].MNB1==""||temparr[i].MNB1==null)
            temparr[i].MNB1=0;
          if(temparr[i].MSEA1==""||temparr[i].MSEA1==null)
            temparr[i].MSEA1=0;
          temparr[i].mark1=parseFloat(temparr[i].MPT1)+parseFloat(temparr[i].MNB1)+parseFloat(temparr[i].MSEA1);
          if(req.query.termname=="halfyearly"){
          if(temparr[i].MPT1==""||temparr[i].MPT1==null)
            temparr[i].MPT1=0;
          if(temparr[i].MNB1==""||temparr[i].MNB1==null)
            temparr[i].MNB1=0;
          if(temparr[i].MSEA1==""||temparr[i].MSEA1==null)
            temparr[i].MSEA1=0;
          temparr[i].mark1=parseFloat(temparr[i].MPT1)+parseFloat(temparr[i].MNB1)+parseFloat(temparr[i].MSEA1);
          }
          if(req.query.termname=="preannual"){
          if(temparr[i].MPT1==""||temparr[i].MPT1==null)
            temparr[i].MPT1=0;
          if(temparr[i].MNB1==""||temparr[i].MNB1==null)
            temparr[i].MNB1=0;
          if(temparr[i].MSEA1==""||temparr[i].MSEA1==null)
            temparr[i].MSEA1=0;
          temparr[i].mark1=parseFloat(temparr[i].MPT1)+parseFloat(temparr[i].MNB1)+parseFloat(temparr[i].MSEA1);
          }

          // alert(JSON.stringify(temparr));
          // for(var i=0;i<temparr.length;i++){
            for(var j=0;j<global.scaleuparrs.length;j++){
              if(req.query.grade==global.scaleuparrs[j].grade_name&&temparr[i].subject==global.scaleuparrs[j].subject_name){
              // alert(localStorage.getItem("curr_sess_grade")+" "+scaleup[j].grade_name+" "+temparr[i].subject+" "+scaleup[j].subject_name);
              // alert('in  '+temparr[i].mark1+"  "+scaleup[j].tot);
              temparr[i].mark1=parseFloat((parseFloat(temparr[i].mark1)/parseFloat(global.scaleuparrs[j].tot))*100).toFixed(2);
              // alert(temparr[i].mark1);
              }
            }
          // }
 
          for(var n=0;n<global.gradearrs.length;n++){
            if(parseFloat(temparr[i].mark1)>=parseFloat(global.gradearrs[n].lower_limit)&&parseFloat(temparr[i].mark1)<=parseFloat(global.gradearrs[n].upper_limit))
              temparr[i].grade1=global.gradearrs[n].grade;
            if(req.query.termname=="halfyearly"){
            if(parseFloat(temparr[i].mark1)>=parseFloat(global.gradearrs[n].lower_limit)&&parseFloat(temparr[i].mark1)<=parseFloat(global.gradearrs[n].upper_limit))
              temparr[i].grade1=global.gradearrs[n].grade;
            }
            if(req.query.termname=="preannual"){
            if(parseFloat(temparr[i].mark1)>=parseFloat(global.gradearrs[n].lower_limit)&&parseFloat(temparr[i].mark1)<=parseFloat(global.gradearrs[n].upper_limit))
              temparr[i].grade1=global.gradearrs[n].grade;
            }
          }
        }

    for(var i=0;i<global.coarrsvalus.length;i++){
          for(var j=0;j<global.gradearrss.length;j++){
      if(parseFloat(global.coarrsvalus[i].total)>=parseFloat(global.gradearrss[j].lower_limit)&&parseFloat(global.coarrsvalus[i].total)<=parseFloat(global.gradearrss[j].higher_limit))
              global.coarrsvalus[i].grade=global.gradearrss[j].grade;
          }
        }
        var temp=[];
        var obj={};
        for(var i=0;i<global.coarrsvalus.length;i++){
          if(global.coarrsvalus[i].subject_id=="Discipline"){
            obj=global.coarrsvalus.splice(i,1);
             temp.push(obj);
          }
        }
     var headers="<center><h2>REPORT CARD</h2></center>";

         var pesonalinfo="<table ><tr><th style='text-align:left;'>Roll No: </th><th style='text-align: left;'>"+studentid+"</th></tr><tr><th style='text-align: left;'>Student’s Name: </th><th style='text-align: left;'>"+studentname+"</th></tr><tr><th style='text-align: left;'>Mother’s/Father’s/Guardian’s Name: </th><th style='text-align: left;'>"+fathername+"</th></tr><tr><th style='text-align: left;'>Date of birth: </th><th style='text-align: left;'>"+dob+"</th></tr><tr><th style='text-align: left;'>Class/Section: </th><th style='text-align: left;'>"+section+"/"+classs+"</th></tr></table><br><br>";

        var scolasticinformation ="<table class='tab' style='border-collapse: collapse; border: solid 2px;' border='1'><tr><th>Scholastic Areas</th><th colspan='5'><center>"+req.query.termname+"</center></th></tr><tr><th>Subjects</th><th>Periodic Test (10)</th><th>Note Book (5)</th><th>Subject Enrich ment (5)</th><th>Marks Obtained (100)</th><th>Grade</th></tr>"
       for(var i=0;i<temparr.length;i++)
           {
            scolasticinformation +="<tr><td>"+temparr[i].subject+"</td><td>"+temparr[i].PT1+"</td><td>"+temparr[i].NB1+"</td><td>"+temparr[i].SEA1+"</td><td>"+temparr[i].mark1+"</td><td>"+temparr[i].grade1+"</td></tr>"
           }
          scolasticinformation +="</table><br><br>";

          var coscolasticinformation="<table class='tab1' style='border-collapse: collapse;' border='1'><tr><th style='text-align: left;'>Co scholastic Areas [on a 5 point A – E grading scale]</th><th style='text-align: left;'>Grade</th></tr>"
           for(var i=0;i<global.coarrsvalus.length;i++){

            coscolasticinformation +="<tr><td>"+global.coarrsvalus[i].subject_id+"</td><td>"+global.coarrsvalus[i].grade+"</td></tr>";
           }
           coscolasticinformation +="</table><br><br>";

          var gradingrate ="<table class='tab1' style='border-collapse: collapse;'border='1'><tr><th style='text-align: left;'>[A - E grading scale]</th><th style='text-align: left;''>Grade</th></tr>"
              for(var i=0;i<temp.length;i++){
             gradingrate +="<tr><td>"+temp[i].subject_id+"</td><td>"+temp[i].grade+"</td></tr>"    
              }
             
          
             gradingrate +="</table><br><br>";

          var results="<table class='tab2'><tr><th style='text-align: left;'>Class Teacher's Remarks</th><th>"+req.query.remark+"</th></tr><tr><th style='text-align: left;'>Result</th><th>"+req.query.result+"</th></tr></table><br><br>";

          var  sinfnaturs ="<table style='width: 650px;margin-left:10px;'> <tr><th><center>"+req.query.date+"</center></th><th></th><th><center><img width='100px' height='45px' src="+staff+"></center></th><th></th><th><center><img  width='100px' height='45px' src="+principalxx+"></center></th><th></th></tr>";

          sinfnaturs +="<tr><th><center>Date</center></th><th></th><th><center>Signature of Class Teacher's</center></th><th></th><th><center>Signature of Principal</center></th><th></th></tr></table><br><br><br><br>";

 var ovaraltemplates=headers+pesonalinfo+scolasticinformation+coscolasticinformation+gradingrate+results+sinfnaturs;
 
 var finaloverall="<div style='position: relative;width:650px;height: auto;border: 5px solid #849FDC;top:50px;left: 10px;'>"+ovaraltemplates+"</div>";
  console.log("45");
         htmlToPdf.convertHTMLString(finaloverall, './app/reportcard/'+global.global.studentpersonalinfo[0].student_name+'.pdf',

     

    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
        //   logfile.write('pdf write:success\n\n');
          console.log('Converted');
          res.status(200).json({'returnval': 'converted'});     
        }
    });
  
});
app.post('/insertattendance-service',  urlencodedParser,function (req,res)
{   
  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         attendance:req.query.attendance,
         working_days:req.query.workingdays,
         generic:req.query.generic,
         speccomment:req.query.specific,
         grade:req.query.grade,
         section:req.query.section                 
  } 
  var qur="SELECT * FROM tr_term_attendance where school_id='"+req.query.schoolid+"' and "+
  "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and section='"+req.query.section+"' and "+
  "grade='"+req.query.grade+"'and "+
  "student_id='"+req.query.studentid+"'";

 console.log("-------------Attendance UPDATE------------------");
  console.log(qur);
 console.log("------------------------------------------------");
  console.log("UPDATE tr_term_attendance SET generic='"+req.query.generic+"',speccomment='"+req.query.specific+"',attendance='"+req.query.attendance+"' where school_id='"+req.query.schoolid+"' and "+
  "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and section='"+req.query.section+"'  and grade='"+req.query.grade+"' and "+
  "student_id='"+req.query.studentid+"'");
  console.log("------------------------------------------------");

connection.query(qur,
function(err, rows)
{
  if(rows.length==0){ 
  connection.query("INSERT INTO tr_term_attendance SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log("error in insert......"+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
}
else
{
  connection.query("UPDATE tr_term_attendance SET ? where school_id='"+req.query.schoolid+"' and "+
  "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and section='"+req.query.section+"'  and grade='"+req.query.grade+"' and "+
  "student_id='"+req.query.studentid+"'",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log("error in update......"+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
}
});
});

//term health
app.post('/inserthealth-service',  urlencodedParser,function (req,res)
{   
  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         height:req.query.height,
         weight:req.query.weight,
         grade:req.query.grade,
         section:req.query.section,
         blood_group:req.query.bloodgroup,
         vision_left:req.query.visionleft,                          
         vision_right:req.query.visionright,
         dental:req.query.dental
  }  

  connection.query("select* from tr_term_health where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_health SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_health SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

app.post('/insertphysical-service',  urlencodedParser,function (req,res)
{   

  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         interest_area:req.query.interest,
         identified_talent:req.query.talent,
         grade:req.query.grade,
         section:req.query.section,
         member_of_school:req.query.membership,                          
         competitions_attended:req.query.competition,
         prize_won:req.query.prize
  }  

  connection.query("select* from tr_term_physical_education where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_physical_education SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_physical_education SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

app.post('/insertartvertical-service',  urlencodedParser,function (req,res)
{   

  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         interest_area:req.query.interest,
         identified_talent:req.query.talent,
         grade:req.query.grade,
         section:req.query.section,
         member_of_school:req.query.membership,  
         coaching:req.query.coaching,                        
         competitions_attended:req.query.competition,
         prize_won:req.query.prize
  }  

  connection.query("select* from tr_term_art_verticals where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_art_verticals SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_art_verticals SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

//fetchhealthattendanceinfo
app.post('/fetchhealthattendanceinfo-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  var academicyear={academic_year:req.query.academicyear}; 
  var qur="select * from tr_term_attendance ta join tr_term_health th on(ta.student_id=th.student_id and ta.term_id=th.term_id)"+
  " where ta.student_id='"+req.query.studid+"' "+
  "and ta.school_id='"+req.query.schoolid+"' and  ta.academic_year='"+req.query.academicyear+"' and th.school_id='"+req.query.schoolid+"' and th.academic_year='"+req.query.academicyear+"'";
  console.log('----------------------');
  console.log(qur); 
  console.log('----------------------');

  var qur1="select distinct(term_id),school_id,academic_year,term_id,student_id,student_name,class_id,grade,section,attendance,working_days,speccomment,generic from tr_term_attendance "+
  " where student_id='"+req.query.studid+"' "+
  " and school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and term_id in(select term_name from md_term "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) order by term_id";
  var qur2="select distinct(term_id),school_id,academic_year,term_id,student_id,student_name,class_id,grade,section,height,weight,blood_group,vision_left,vision_right,dental,bmi,remark from tr_term_health "+
  " where student_id='"+req.query.studid+"' "+
  "and school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and term_id in(select term_name from md_term "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) order by term_id";
  console.log('-----------health & attendance-----------');
  console.log(qur1); 
  console.log(qur2); 
  var attendance=[];
  var health=[];
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {     
      if(rows.length>0){
        connection.query(qur1,function(err, rows){
           global.attendanceinfo=rows; 
          attendance=rows; 
          console.log(rows);
          connection.query(qur2,function(err, rows){ 
          global.healthinfo=rows; 
          health=rows;
          res.status(200).json({'attendance': attendance,'health': health});
          });
        });
      }
      else{
        console.log(qur1);
        connection.query(qur1,function(err, rows){
          global.attendanceinfo=rows; 
          attendance=rows; 
          connection.query(qur2,function(err, rows){  
          global.healthinfo=rows; 
          health=rows;
          res.status(200).json({'attendance': attendance,'health': health});
          });
        });
      }
      }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

/*app.post('/undotudentverifyvalues1-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  tr_student_varified_table where school_id='"+req.query.schoolid+"' and "+
    "grade_name='"+req.query.grade+"' and section_name='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_id='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});





*/





//fetchcoscholasticinfo
app.post('/fetchcoscholasticmetrics-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  var qur="SELECT * FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"' and term_name in(select term_name from md_term "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'))";
  // console.log(qur);
  connection.query(qur,
     function(err, rows)
    {
    if(!err)
    {       
      global.coscholasticmark=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
});
});

//fetch the name for performance report

app.post('/nameforonetofourreport-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};

  connection.query("SELECT id,student_name FROM md_student WHERE ? and flag='active'",[schoolid],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/getstudentinformation-service',urlencodedParser,function (req,res)
 {  
 var qur="select distinct(student_id) as id,student_name,grade,section from single_student_markentry_table where flag='completed' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.role+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"')) and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'";
   console.log(qur);  
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
//fetchcoscholasticinfo
app.post('/fetchcoscholasticinfo-service',  urlencodedParser,function (req,res)
{  

  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  
  var qur="SELECT * FROM tr_coscholastic_assesment_marks am join "+
  "md_grade_coscholastic_descriptor gd on(am.sub_category=gd.category) WHERE school_id='"+req.query.schoolid+"' AND student_id='"+req.query.studid+"' and am.category_grade=gd.grade and "+
  "am.subject_id=gd.subject_name and term_name in(select term_name from md_term "+
  "where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'))";
  console.log('.........................Score card....................................');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.scholasticinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });

//   var schoolid={school_id:req.query.schoolid};
//   var studid={student_id:req.query.studid};  
//   // var qur="SELECT subject_id,round((sum(mark)/count(subject_id))/10,1) as mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_name='"+req.query.studname+"' group by subject_id ";
//   var qur="SELECT subject_id,sub_category,mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"'";
//   // console.log(qur);
//   connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {       
//        global.coscholasticinfo=rows;
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'fail'});
//     }  

// });
});

app.post('/fetchcoscholasticsubcategory-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  // var qur="SELECT subject_id,round((sum(mark)/count(subject_id))/10,1) as mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_name='"+req.query.studname+"' group by subject_id ";
  var qur="SELECT * FROM tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"'";
  // console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
global.coscholasticsubmark=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

});
});

app.post('/onetofourreport-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var id={student_id:req.query.student_id}
  

  connection.query("SELECT subject_id,term_name, count(mark) as cnt, category, sum(mark) as val  FROM tr_term_assesment_marks WHERE ? and ? group by category,term_name,subject_id",[schoolid,id],
    function(err, rows)
    {
    if(!err)
    {      
    //console.log(rows); 
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreport-service',  urlencodedParser,function (req, res)
{
  var qur="select * from tr_term_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"'";
  console.log('----------------------------------------fetchreport----------');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    { 
      
      res.status(200).json({'returnval': rows});
      
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchfareport-service',  urlencodedParser,function (req, res)
{
  var qur="select * from tr_term_fa_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"'  and term_name='"+req.query.termname+"' and category='"+req.query.assesmenttype+"' order by sub_cat_sequence";
  console.log('----------------------------------------fetchreport----------');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    { 
      
      res.status(200).json({'returnval': rows});
      
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchfastudentreport-service',  urlencodedParser,function (req, res)
{
  var flag="";
  var qurcheck="";
  //console.log('com');
  console.log(req.query.roleid);
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    console.log('c');
    flag="0";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmenttype+"' and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    console.log('o');
    flag="1";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmenttype+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

  var qur="select * from tr_term_fa_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmenttype+"' order by CAST(sub_cat_sequence AS UNSIGNED) ";
  console.log('----------------------------------------fetchreport222----------');
  console.log(qur);
  console.log(qurcheck);

  connection.query(qurcheck,function(err, rows){
    if(!err){
      if(rows.length==0){
        console.log('f');
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
    }
    else{
      console.log('d');
      res.status(200).json({'returnval': 'imported'});
    }
    }
  });
});

app.post('/fetchworkingdays-service',  urlencodedParser,function (req, res)
{
  var qur="select * from md_workingdays where ? and ? and ? and ?";
  console.log(qur);
  var academicyear={academic_year:req.query.academicyear};
  var schoolid={school_id:req.query.schoolid};
  var termname={term_name:req.query.termname};
  var type={type:req.query.grade};
  console.log(req.query.academicyear+" "+req.query.schoolid+" "+req.query.termname+" "+req.query.type);
  connection.query(qur,[academicyear,schoolid,termname,type],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/updateimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
if(req.query.subject=='II Language Hindi'||req.query.subject=='II Language Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and flag='active' and academic_year='"+req.query.academicyear+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) AS count2)  AS counts";
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});

app.post('/updatefaimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
console.log(req.query.assesmentid+'  '+req.query.subject);
if(req.query.assesmentid=="FA1"||req.query.assesmentid=="FA2"||req.query.assesmentid=="SA1"||req.query.assesmentid=="FA3"||req.query.assesmentid=="FA4"||req.query.assesmentid=="SA2"){

if(req.query.subject=='II Language Hindi'||req.query.subject=='II Language Kannada'||req.query.subject=='French'||req.query.subject=='sanskrit'||req.query.subject=='III Language Kannada'||req.query.subject=='III Language Hindi'||req.query.subject=='II Language French'){

  console.log("Language");
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_fa_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"'  and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' ) and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
  console.log("not Language");
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_fa_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"'  and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"'))) AS count2)  AS counts";
}
}
else
{
if(req.query.subject=='II Language Hindi'||req.query.subject=='II Language Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_coscholastic_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where academic_year='"+req.query.academicyear+"'  and flag='active' and school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_coscholastic_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) AS count2)  AS counts";
} 
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});
app.post('/updateimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.sectionname,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesmentid,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
      if(rows.length>0)
      {
        res.status(200).json({'returnval': 'exist'});
      }
      else{ 
      connection.query('insert into tr_term_assesment_import_marks set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
      res.status(200).json({'returnval': 'succ'});
      }
    else
    {
      console.log('No data Fetched'+err);
    }
});
  }
}
else
console.log(err);
});
});

app.post('/currentschoolinsertdata-service' ,  urlencodedParser,function (req, res)
{ 
var qur="insert into md_admission select enquiry_no,admission_no,'"+req.query.newschoolid+"','"+req.query.newschoolname+"',admission_year,'"+req.query.newacademic+"',first_name,middle_name,last_name,student_name,'"+req.query.newgradename+"',dob,gender,father_name,mother_name,disabled_student,canteen_availed, transport_availed,created_by, created_on, last_updated_by,last_updated_on,academic_acheivement, admission_type,discount_type,previous_history,having_sibling,admission_status,'"+req.query.status+"',referral_type,age,actual_status,flag from md_admission where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and class_for_admission='"+req.query.gradename+"' and admission_no='"+req.query.studentid+"'";

   
  var qur2="insert into md_student select '"+req.query.newschoolid+"',id,student_name,'"+req.query.cursectionid+"',school_type,dob,gender,bloodgroup,ageinmonth,feepaid_status,'"+req.query.newgradeid+"','"+req.query.newacademic+"',flag from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyears+"' and grade_id='"+req.query.gradeid+"' and class_id='"+req.query.sectionid+"' and id='"+req.query.studentid+"'"; 

    console.log("------Schoolid info-----");
     console.log(qur);
     console.log(qur2);
    console.log("----------------------");

    connection.query(qur,function(err, Result)
    {
    if(!err)
    {
   connection.query(qur2, function(err, Result)
    {
    if(!err)
    {
   res.status(200).json({'returnval': "process"});
   }
    else
      console.log(err);
   
});
 }
 else
      console.log(err);
});

});



app.post('/currentschooltermvisetransfer-service' ,  urlencodedParser,function (req, res)
{ 


 var qur="insert into tr_beginner_assesment_marks select '"+req.query.newschoolid+"',academic_year,assesment_id,class_id,student_id,category_id,  mark,score,grade,subject_id,assesment_type,'"+req.query.newgradename+"','"+req.query.newsectionname+"',student_name,subject_name,category_name,sub_category_id,sub_category_name,level, status,enrich_level,speed_level,comprehension_level from tr_beginner_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademic+"' and grade_id='"+req.query.oldgradename+"' and section_id='"+req.query.oldsectionname+"' and student_id='"+req.query.studentid+"'";

   var qur1=" insert into tr_term_attendance select '"+req.query.newschoolid+"',academic_year,term_id,student_id,student_name,'"+req.query.newsectionid+"','"+req.query.newgradename+"','"+req.query.newsectionname+"',attendance,working_days,speccomment,generic from tr_term_attendance where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademic+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_id='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";  
 
  var qur2=" insert into tr_term_health select '"+req.query.newschoolid+"',academic_year,term_id,student_id,student_name,'"+req.query.newsectionid+"','"+req.query.newgradename+"','"+req.query.newsectionname+"',height,weight, blood_group,vision_left,vision_right,dental,bmi,remark from tr_term_health where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademic+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_id='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
  
  var qur3="insert into tr_student_to_subject select '"+req.query.newschoolid+"',academic_year,student_id,'"+req.query.newgradeid+"','"+req.query.newsectionname+"',subject_id,student_name,'"+req.query.newsectionid+"',lang_pref,flag from tr_student_to_subject where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademic+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and student_id='"+req.query.studentid+"'"; 
     console.log("------commone School info-----");
     console.log(qur);
     console.log(qur1);
     console.log(qur2);
     console.log(qur3); 
     
     console.log("------------------------------");
   
    connection.query(qur, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur1, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur2, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur3, function(err, Result)
    {
    if(!err)
    {
     res.status(200).json({'returnval': "commonProcess"});
    
    }
    else
       console.log(err);
   });  
  }
  else
   console.log(err);
 });  
 }
  else
   console.log(err);
 });  
 }
else
  console.log(err);
});
});

app.post('/schooltranferfivetoten-service' ,  urlencodedParser,function (req, res)
{ 




var qur1=" insert into tr_term_fa_assesment_marks select '"+req.query.newschoolid+"',academic_year,  assesment_id,term_name,class_id,student_id,student_name,'"+req.query.newgradename+"','"+req.query.newsectionname+"',subject_id,category,sub_category,mark,subject_category,flag,sub_cat_sequence from tr_term_fa_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";  
 
var qur2="insert into tr_term_overallfa_assesment_marks select '"+req.query.newschoolid+"',academic_year,term_name,student_id,student_name,'"+req.query.newgradename+"','"+req.query.newsectionname+"',subject_id,category,total,cat_grade from tr_term_overallfa_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";  

var qur3="insert into tr_coscholastic_assesment_marks select '"+req.query.newschoolid+"',academic_year,assessment_id,term_name,class_id,student_id,student_name,'"+req.query.newgradename+"','"+req.query.newsectionname+"',subject_id,sub_category,mark,subject_category,category_grade,sub_seq from tr_coscholastic_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
 
 var qur4="insert into tr_coscholastic_sub_category_assesment_marks select '"+req.query.newschoolid+"',academic_year,assessment_id,term_name,class_id,student_id,student_name,'"+req.query.newgradename+"','"+req.query.newsectionname+"',subject_id,category,sub_category,mark,category_grade,  order_seq from tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
   console.log("------commone 5to10 info-----");
     console.log(qur1);
     console.log(qur2);
     console.log(qur3);
     console.log(qur4);
     console.log("------------------------------");
   
   connection.query(qur4, function(err, Result)
    {
    if(!err)
    {
     connection.query(qur1, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur2, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur3, function(err, Result)
    {
    if(!err)
    {
     res.status(200).json({'returnval': "process"});
    
    }
    else
       console.log(err);
    
  });  
 }
  else
       console.log(err);
    
 });  
 }
  else
       console.log(err);
    
});
 }
  else
       console.log(err);
    
});
});

app.post('/schooltranferonetofour-service' ,  urlencodedParser,function (req, res)
{ 



   var qur1=" insert into tr_term_assesment_marks select '"+req.query.newschoolid+"',academic_year,  assesment_id,term_name,class_id,student_id,student_name,'"+req.query.newgradename+"','"+req.query.newsectionname+"',subject_id,category,sub_category,mark,subject_category,flag,sub_cat_sequence from tr_term_assesment_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";  
 
var qur2=" insert into tr_term_assesment_overall_marks select '"+req.query.newschoolid+"',academic_year,assesment_id,term_name,student_id,subject_id,category,total,rtotal,'"+req.query.newgradename+"','"+req.query.newsectionname+"' from tr_term_assesment_overall_marks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";  

var qur3="insert into tr_term_assesment_overall_assesmentmarks select '"+req.query.newschoolid+"',academic_year,term_name,student_id,subject_id,category,total,rtotal,term_cat_grade,'"+req.query.newgradename+"','"+req.query.newsectionname+"' from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.oldschoolid+"' and academic_year='"+req.query.oldacademicyear+"' and grade='"+req.query.oldgradename+"' and section='"+req.query.oldsectionname+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
 
   console.log("------commone 1to4 info-----");
     console.log(qur1);
     console.log(qur2);
     console.log(qur3);
     console.log("------------------------------");
   
    connection.query(qur1, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur2, function(err, Result)
    {
    if(!err)
    {
    connection.query(qur3, function(err, Result)
    {
    if(!err)
    {
     res.status(200).json({'returnval': "process"});
    
    }
    else
       console.log(err);
    
  });  
 }
 else
    console.log(err);
});  
 }
 else
   console.log(err);
});
});

app.post('/passstudentverifyvalues-service' ,  urlencodedParser,function (req, res)
{
    var data={
       school_id:req.query.schoolid,
       grade_name:req.query.grade,
       section_name:req.query.section,
       academic_year: req.query.academicyear,
       term_id:req.query.termname,
       student_id:req.query.studentid,
       student_name:req.query.studentname,
     };
    var qur="select * from tr_student_varified_table where school_id='"+req.query.schoolid+"' and "+
    "grade_name='"+req.query.grade+"' and section_name='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_id='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
    console.log('...............verify pdf info ..........');
    console.log(qur);
    connection.query(qur, function(err, rows)
      { 
      if(!err)
      {        
      if(rows.length==0)
      {
  connection.query('insert into tr_student_varified_table set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
      res.status(200).json({'returnval': 'succ'});
      }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
       
      }
      else{ 
     res.status(200).json({'returnval': 'all ready exit'});
     }
}
else
console.log(err);
});
});

app.post('/updatefaimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.section,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesment,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    console.log(data);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
      if(rows.length>0)
      {
        res.status(200).json({'returnval': 'exist'});
      }
      else{ 
      connection.query('insert into tr_term_fa_assesment_import_marks set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
      res.status(200).json({'returnval': 'succ'});
      }
    else
    {
      console.log('No data Fetched'+err);
    }
});
  }
}
else
console.log(err);
});
});


app.post('/callsubjectapprovaladitcheck-service' ,  urlencodedParser,function (req, res)
{
var querycheck='';
var insertqur='';
var updatequr='';
var updateval='';
var response={
  school_id:req.query.schoolid,
  academic_year:req.query.academicyear,
  term_name:req.query.termname,
  grade:req.query.gradename,
  section:req.query.sectionname,
  subject_id:req.query.subject,
  assesment_level1:req.query.assesmentid
 };
var qur="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='Assesment3'  and subject_id='"+req.query.subject+"'";
if(req.query.assesmentid=='Assesment1'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='"+req.query.assesmentid+"'  and subject_id='"+req.query.subject+"'";  
insertqur="insert into tr_term_auditimport set ?";
}
else if(req.query.assesmentid=='Assesment2'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='Assesment1'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level1='Assesment1';
 updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='Assesment1'  and subject_id='"+req.query.subject+"'";
updateval={assesment_level1:req.query.assesmentid};
}
else if(req.query.assesmentid=='Assesment3'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='Assesment2'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level1='Assesment2';
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level1='Assesment2'  and subject_id='"+req.query.subject+"'";  
updateval={assesment_level1:req.query.assesmentid};
}

 console.log('------------audit term check-----------------------');
 console.log(qurcheck);
 console.log('------------audit term insert----------------------');
 console.log(insertqur);
 console.log('------------audit term update----------------------');
 console.log(updatequr);
connection.query(qur,function(err, rows){
  if(!err){
    if(rows.length>0){
      res.status(200).json({'returnval': 'revertapprove'});
    }
    else{
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(req.query.assesmentid=='Assesment1'){
    if(rows.length==0){
      connection.query(insertqur,[response],function(err, result){
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      console.log(err);
      res.status(200).json({'returnval': 'not updated'});
      }
      });
    }
    
    else
      res.status(200).json({'returnval': 'exist'});
    }
    else{
      if(rows.length==1){
      connection.query(updatequr,[updateval],function(err, result){
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      console.log(err);
      res.status(200).json({'returnval': 'not updated'});
      }
      });
      }
      else
       res.status(200).json({'returnval': 'not exist'}); 
    }    
    }  
    else
      console.log(err);
    
  });
}
}
else
  console.log(err);
});
});



app.post('/auditterm-service' ,  urlencodedParser,function (req, res)
{
var querycheck='';
var insertqur='';
var updatequr='';
var updateval='';
var response={
  school_id:req.query.schoolid,
  academic_year:req.query.academicyear,
  term_name:req.query.termname,
  grade:req.query.gradename,
  section:req.query.sectionname,
  subject_id:req.query.subject,
  assesment_level2:req.query.assesmentid
 };

if(req.query.assesmentid=='Assesment1'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and (assesment_level2='' or assesment_level2 is null)  and subject_id='"+req.query.subject+"'";  
// insertqur="insert into tr_term_auditimport set ?";
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and (assesment_level2='' or assesment_level2 is null) and subject_id='"+req.query.subject+"'";
updateval={assesment_level2:req.query.assesmentid};
}
else if(req.query.assesmentid=='Assesment2'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment1'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level2='Assesment1';
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment1'  and subject_id='"+req.query.subject+"'";
updateval={assesment_level2:req.query.assesmentid};
}
else if(req.query.assesmentid=='Assesment3'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment2'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level2='Assesment2';
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment2'  and subject_id='"+req.query.subject+"'";  
updateval={assesment_level2:req.query.assesmentid};
}

 console.log('------------audit term check-----------------------');
 console.log(qurcheck);
 console.log('------------audit term insert----------------------');
 console.log(insertqur);
 console.log('------------audit term update----------------------');
 console.log(updatequr);
      // connection.query(updatequr,[updateval],function(err, result){
      // if(result.affectedRows>0)
      // {
      // res.status(200).json({'returnval': 'updated'});
      // }
      // else
      // {
      // console.log(err);
      // res.status(200).json({'returnval': 'not updated'});
      // }
      // });

  connection.query(qurcheck,function(err, rows){
    if(!err){
    // if(req.query.assesmentid=='Assesment1'){
    // if(rows.length==0){
    //   connection.query(insertqur,[response],function(err, result){
    //   if(result.affectedRows>0)
    //   {
    //   res.status(200).json({'returnval': 'updated'});
    //   }
    //   else
    //   {
    //   console.log(err);
    //   res.status(200).json({'returnval': 'not updated'});
    //   }
    //   });
    // }
    
    // else
    //   res.status(200).json({'returnval': 'exist'});
    // }
    // else{
      if(rows.length==1){
      connection.query(updatequr,[updateval],function(err, result){
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      console.log(err);
      res.status(200).json({'returnval': 'not updated'});
      }
      });
      }
      else
       res.status(200).json({'returnval': 'not exist'}); 
    // }    
    }  
    else
      console.log(err);
    
  });
});

app.post('/updateflag-service' ,  urlencodedParser,function (req, res)
{    
 var qurcheck="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});


app.post('/updatefaflag-service' ,  urlencodedParser,function (req, res)
{    
  var qurcheck="select * from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_fa_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
  
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});

app.post('/updatefaflag1-service' ,  urlencodedParser,function (req, res)
{    
 
 var qurcheck="select * from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesmentid+"'";
 var updatequr="update tr_term_fa_assesment_import_marks set flag='0' where school_id='"+req.query.schoolid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesmentid+"'";
 var deletequr="delete from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesmentid+"'";
 console.log('fa flag update');
 console.log(qurcheck);
 console.log(updatequr);
 console.log(deletequr);
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length>0){
    if(req.query.flag=='0'){
    connection.query(deletequr,function(err, result){
    res.status(200).json({'returnval': 'done'});
    });
    }
    if(req.query.flag=='1'){
    connection.query(updatequr,function(err, result){
    res.status(200).json({'returnval': 'done'});
    });
    }
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});

app.post('/approvemark-service',  urlencodedParser,function (req, res)
{
//var qur="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"'";
var checkqur="select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator'";

var qur1="select *,(select type from md_subject where subject_name=subject) as types,(select subject_category from md_subject where subject_name=subject) as category,(select type from md_subject where subject_name=subject) as types, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"'))";

var qur2="select *,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator' and academic_year='"+req.query.academicyear+"'))";

console.log('.......................subject approval fetch.....................');
console.log(checkqur);
console.log('............................................');
console.log(qur1);
console.log('............................................');
console.log(qur2);
var resp={
  flag:""
};
var arr=[];
var f1=0,f2=0;
connection.query(checkqur,function(err, rows){
  if(rows.length>0){
    console.log('-----------------in----------------------');
    for(var i=0;i<rows.length;i++){
      if(rows[i].grade_id=='g1'||rows[i].grade_id=='g2'||rows[i].grade_id=='g3'||rows[i].grade_id=='g4')
        {
        resp.flag=1;
        f1=1;
        }
      else{
        resp.flag=0;
        f2=1;
      }
    }
  }
  // else{
  console.log('-----------------out----------------------');
  console.log('response flag...........'+resp.flag+" f1.... "+f1+" f2.... "+f2);
  if(f1==1&&f2==1){
    connection.query(qur1,function(err, rows)
    {
      if(!err){
      if(rows.length>0)
      {
        console.log('----------------primary--------------'+rows.length);
        arr=rows;
      }
      connection.query(qur2,function(err, rows)
      {
        if(!err){
          if(rows.length>0){
          console.log('----------------high--------------'+rows.length);
          for(var i=0;i<rows.length;i++){
            arr.push(rows[i]);
          }
          }
          console.log('------whole---------'+arr.length);
          res.status(200).json({'returnval': arr});     
        }
      });
      }
    });
  }
  else{
  if(resp.flag==1){
  connection.query(qur1,function(err, rows)
    {
      console.log(qur1);
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
  if(resp.flag==0){
    console.log(qur2);
  connection.query(qur2,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
  }
// }
});
});


app.post('/filterapprovemark11-service' ,  urlencodedParser,function (req, res)
{   
 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'"
var qur1;
var qur2;
  // var qur="select * from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) where s.school_id='"+req.query.schoolid+"' and "+
  // " g.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
  // " g.term_id='"+req.query.term+"' and s.grade_id in(select grade_id from mp_teacher_grade where "+ 
  // " id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"') and s.subject_id not in('s14') order by g.grade_name,g.assesment_name,sub.subject_name";
var qur="select * from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) join md_class_section c on(g.grade_name=c.class) where s.school_id='"+req.query.schoolid+"' and "+
"g.school_id='"+req.query.schoolid+"' and c.school_id='"+req.query.schoolid+"' and c.academic_year='"+req.query.academicyear+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
"g.term_id=(select term_name from md_term where term='"+req.query.term+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and s.grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"') and s.subject_id not in('s14') order by g.grade_name,c.section,g.assesment_name,sub.subject_name";

  if(req.query.filter=="Filter By Grade"){
 
  qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and term_name='"+req.query.term+"'";

  qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and term_name='"+req.query.term+"'";
   
  }

 else if(req.query.filter=="Filter By Section"){

  qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and term_name='"+req.query.term+"'";

 qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and term_name='"+req.query.term+"'";
   
 }

 else if(req.query.filter=="Filter By Subject"){

 qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and term_name='"+req.query.term+"'";

  qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and term_name='"+req.query.term+"'";
   
 }
  
 
 console.log('--------------subject------------------');
 console.log(qur);
 console.log(qur1);
 console.log(qur2);
var overall=[];
connection.query(qur,function(err, rows){
if(!err){
overall=rows;
connection.query(qur1,function(err, rows){
  if(rows.length>0){
     res.status(200).json({'returnval': rows,'overall':overall,'filter':req.query.filter});
  }
  else{
  connection.query(qur2,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows,'overall':overall,'filter':req.query.filter});
    }
    else
      res.status(200).json({'returnval': 'no rows','overall':overall,'filter':req.query.filter});
  });
  }
});
}
});
});

app.post('/filterapprovemark-service' ,  urlencodedParser,function (req, res)
{    

 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'"
var qur1;
var qur2;

  if(req.query.filter=="Filter By Grade"){
 
  qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and term_name='"+req.query.term+"'";

  qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and term_name='"+req.query.term+"'";
   
  }

 else if(req.query.filter=="Filter By Section"){

  qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and term_name='"+req.query.term+"'";

 qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and term_name='"+req.query.term+"'";
   
 }

 else if(req.query.filter=="Filter By Subject"){

 qur1="select  *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks  tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and term_name='"+req.query.term+"'";

  qur2="select * ,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks  where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and term_name='"+req.query.term+"'";
   
 }
  
 
  console.log('--------------subject------------------');
 console.log(qur1);
 console.log(qur2);
connection.query(qur1,function(err, rows){
  if(rows.length>0){
     res.status(200).json({'returnval': rows});
  }
  else{
  connection.query(qur2,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
  }
});
});

app.post('/fetchimportmark-service',  urlencodedParser,function (req, res)
{
  var flag="";
  var qurcheck="";
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    flag="0";
  qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    flag="1";
  qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

  // var qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  // "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  // " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";

  console.log('Query check........');
  console.log(qurcheck);
  console.log('...................');

  var qur="select * from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"'and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.term+"' order by CAST(sub_cat_sequence AS UNSIGNED)";
  //console.log(qur);
  connection.query(qurcheck,function(err, rows){
    if(!err){
      if(rows.length==0){
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
    }
    else{
      res.status(200).json({'returnval': 'imported'});
    }
    }
  });
});

app.post('/updatemark-service' ,  urlencodedParser,function (req, res)
{
  // console.log('come');
  var qur="update tr_term_assesment_marks set mark='"+req.query.mark+"' where academic_year='"+req.query.academic+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.term+"' and academic_year='"+req.query.academic+"' and category='"+req.query.category+"' and sub_category='"+req.query.sub_category+"' and student_id='"+req.query.studid+"'";
      console.log(qur);
      connection.query(qur,
        function(err, result)
        {
        if(!err)
    {
      console.log('s');
      if(result.affectedRows>0){
        res.status(200).json('succ');
      }
      else
        res.status(200).json('fail');
    }
    else
    {
      console.log('No data Fetched'+err);
    }
  });
});

app.post('/closeapproval-service' ,  urlencodedParser,function (req, res)
{
    var qur="UPDATE single_student_markentry_table SET flag='closed' WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and assesment_id='"+req.query.assesment+"' and term_id='"+req.query.termname+"' and flag='completed'";
    console.log(qur);
    connection.query(qur,function(err, result){
    if(!err)
    {
       if(result.affectedRows>0){
        res.status(200).json({'returnval':'succ'});
      }
      else
        res.status(200).json({'returnval':'fail'});
    }
    else
    {
      console.log('No data Fetched'+err);
    }
  });
});


app.post('/checkstatusupdate-service' ,  urlencodedParser,function (req, res)
{
  var qur="SELECT * FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and "+
  " academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' "+
  " and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'";
  var qur1="SELECT * FROM tr_term_auditimport WHERE school_id='"+req.query.schoolid+"' and "+
  " academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
  " grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";
    console.log('--------------mark editing check--------');
    console.log(qur);
    connection.query(qur,function(err, rows){
     if(!err)
     {
      if(rows.length>0){
        var updateflag=rows[0].flag;
        connection.query(qur1,function(err, rows){
        if(!err)
        {
        if(rows.length>0){
        res.status(200).json({'returnval':updateflag,'auditflag':rows[0].assesment_level2});    
        }
        else
        res.status(200).json({'returnval':updateflag,'auditflag':'no rows'});    
        }
        });    
      }
      else
        res.status(200).json({'returnval':'no rows'});
    }
    else
    {
      console.log('No data Fetched'+err);
    }
  });
});


// app.post('/fetchtermmarkforreport-service' ,  urlencodedParser,function (req, res)
// {
  
//     var qur="select term_name,assesment_id,student_id,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as term_grade,"+
//     "subject_id from tr_term_assesment_overall_marks where subject_id='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' "+ 
//     "and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
//     "group by subject_id,term_name,assesment_id,student_id order by student_id";

// //     var qur="select ta.term_name,ta.assesment_id,ta.student_id,(SELECT grade FROM md_grade_rating WHERE "+
// // "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade,"+
// // "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
// // "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
// // "where ta.subject_id='"+req.query.subject+"' and ta.school_id='"+req.query.schoolid+"' and ta.academic_year='"+req.query.academicyear+"' "+
// // "and ta.grade='"+req.query.grade+"' and ta.section='"+req.query.section+"' "+
// // "group by ta.subject_id,ta.term_name,ta.assesment_id,ta.student_id ";

// console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       console.log('yessssssssssssssssssssss');
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       // console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });

app.post('/fetchtermmarkforreport-service' ,  urlencodedParser,function (req, res)
{
  
    var qur="select term_name,assesment_id,student_id,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as term_grade,"+
    "subject_id from tr_term_assesment_overall_marks where subject_id='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' "+ 
    "and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "group by subject_id,term_name,assesment_id,student_id order by student_id";

//     var qur="select ta.term_name,ta.assesment_id,ta.student_id,(SELECT grade FROM md_grade_rating WHERE "+
// "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade,"+
// "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
// "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
// "where ta.subject_id='"+req.query.subject+"' and ta.school_id='"+req.query.schoolid+"' and ta.academic_year='"+req.query.academicyear+"' "+
// "and ta.grade='"+req.query.grade+"' and ta.section='"+req.query.section+"' "+
// "group by ta.subject_id,ta.term_name,ta.assesment_id,ta.student_id ";

console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      console.log('yessssssssssssssssssssss');
      res.status(200).json({'returnval': rows});
    }
    else
    {
      // console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchbeginnermark-service' ,  urlencodedParser,function (req, res)
{
  
    var qur="select distinct(student_id),score,grade,subject_id from tr_beginner_assesment_marks where subject_id='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' "+ 
    "and academic_year='"+req.query.academicyear+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id='"+req.query.section+"' and school_id='"+req.query.schoolid+"') "+
    " order by student_id";

//     var qur="select ta.term_name,ta.assesment_id,ta.student_id,(SELECT grade FROM md_grade_rating WHERE "+
// "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade,"+
// "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
// "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
// "where ta.subject_id='"+req.query.subject+"' and ta.school_id='"+req.query.schoolid+"' and ta.academic_year='"+req.query.academicyear+"' "+
// "and ta.grade='"+req.query.grade+"' and ta.section='"+req.query.section+"' "+
// "group by ta.subject_id,ta.term_name,ta.assesment_id,ta.student_id ";

console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      console.log('yessssssssssssssssssssss');
      res.status(200).json({'returnval': rows});
    }
    else
    {
      // console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchbeginnermarkforreport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select ta.term_name,ta.assesment_id,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade, "+
    "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
    "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
    "group by ta.subject_id,ta.term_name,ta.assesment_id ";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

// app.post('/categorywisereport-service' ,  urlencodedParser,function (req, res)
// {  
//     var catqur="select distinct(sub_seq),sub_category_name,sub_category_id from subject_mapping where "+
//     "academic_year='"+req.query.academicyear+"' "+
//     "and subject_name='"+req.query.subject+"' and grade_name='"+req.query.grade+"' group by sub_category_id,sub_category_name order by  CAST(sub_seq AS UNSIGNED)";
//     var qur="select student_id,subject_id,category,sub_category,round(mark,1) as total,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(mark,1) and higher_limit>=round(mark,1)) as grade "+
//     "from tr_term_assesment_marks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
//     "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,category,sub_category,student_id order by CAST(sub_cat_sequence AS UNSIGNED)";
//     console.log('...............................subjectwise..............................');
//     console.log(qur);
//     console.log(catqur);
//     var arr=[];
//     connection.query(qur,function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       arr=rows;
//     connection.query(catqur,function(err, rows)
//     {
//     if(!err)
//     {
//       res.status(200).json({'returnval': arr,'catarr':rows});
//     }
//     });
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });
app.post('/categorywisereport-service',  urlencodedParser,function (req, res)
{
var qur="select  student_name,student_id,subject_id,category,sub_category,round(mark,1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(mark,1) and higher_limit>=round(mark,1)) as grade "+
    "from tr_term_assesment_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,category,sub_category,student_id order by CAST(sub_cat_sequence AS UNSIGNED)";

var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(distinct (sub_category_id)) as cnt  FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"'  group by subject_id,subject_name,category_id,category_name";
var mapqur="SELECT distinct(sub_category_id) category_name,category_id,sub_category_name,weight,sub_seq ,sub_category_id FROM subject_mapping WHERE  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"'  order by category_id";

 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');

 console.log(categorycnt);
 
 console.log(mapqur);
 console.log('--------------------------------------------------------');
 var arr1=[];
 var arr2=[];
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
    function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
    connection.query(mapqur,
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/categorywisereportfordataanalysis-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,category,sub_category,round(mark,1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(mark,1) and higher_limit>=round(mark,1)) as grade "+
    "from tr_term_assesment_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,category,sub_category,student_id order by CAST(sub_cat_sequence AS UNSIGNED)";
    console.log('...............................categorywise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchinfofortemplate-service',  urlencodedParser,function (req,res)
  {  
    var categorycnt="SELECT category_id,category_name,count(sub_category_id) as cnt FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' group by category_id,category_name";
    var qur="SELECT * FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' order by sub_category_id";
    console.log('------------enrichment template-------------');
    console.log(qur);
    console.log(categorycnt);
    var cnt=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'catarr':cnt,'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});



// app.post('/subjectwisereport-service' ,  urlencodedParser,function (req, res)
// {  
//     var qur="select student_id,assesment_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
//     "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
//     "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by assesment_id,student_id";
//     console.log('...............................subjectwise..............................');
//     console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });
app.post('/subjectwisereport-service',  urlencodedParser,function (req, res)
{
var qur="select (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname,student_id,assesment_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,assesment_id";

 var categorycnt="SELECT distinct (assesment_type)  FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"'";

console.log('--------suibject report--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
 var arr1=[];

 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
   
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':rows});
    }
    });
    }
   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


// app.post('/assesmentwisereport-service' ,  urlencodedParser,function (req, res)
// {  
//     var qur="select student_id,subject_id,round(avg(rtotal),1) as mark,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
//     "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' "+
//     "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id";
//     console.log('...............................assessmentwise..............................');
//     console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });
app.post('/assesmentwisereport-service',  urlencodedParser,function (req, res)
{
  var qur="select (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname,student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,CHAR_LENGTH(subject_id)";

  var categorycnt="SELECT distinct(subject_id),subject_name FROM subject_mapping  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and  subject_id in(select subject_id from mp_grade_subject where school_id='"+req.query.schoolid+"' and  grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academicyear+"' ) and  assesment_type='"+req.query.assesment+"'group by CHAR_LENGTH(subject_name)";

console.log('--------asesmentasdawe--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
 var arr1=[];

 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
   
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':rows});
    }
    });
    }
   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


// app.post('/termwisereport-service' ,  urlencodedParser,function (req, res)
// {  
//     var qur="select assesment_id,student_id,subject_id,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
//     "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
//     "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by assesment_id,subject_id,student_id";
    
//     console.log('......................termwise..............................');
//     console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });
app.post('/termwisereport-service',  urlencodedParser,function (req, res)
{
  var qur="select  (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname, assesment_id,student_id,subject_id,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,assesment_id,CHAR_LENGTH(subject_id)";

 


var categorycnt="SELECT subject_id,subject_name FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  subject_id in(select subject_id from mp_grade_subject where school_id='"+req.query.schoolid+"' and  grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academicyear+"' ) and grade_name='"+req.query.grade+"' group by assesment_type,CHAR_LENGTH(subject_name)";

    var map="SELECT distinct(assesment_type) FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and school_id='"+req.query.schoolid+"' and "+
   "grade_name='"+req.query.grade+"' order by assesment_type";


console.log('--------suibject report--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
 var arr1=[];
 var arr2=[];

 connection.query(qur, function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
 connection.query(categorycnt, function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
  connection.query(map,function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'arr1':arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/teacherid-service' ,  urlencodedParser,function (req, res)
{ 
  var qur;
 var schol={school_id:req.query.schoolid};
 var teacherid=req.query.id;
 var role={role_id:req.query.roleid};
 console.log(req.query.roleid);
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and school_id='"+req.query.schoolid+"' and role_id='subject-teacher' and id in (select id from mp_teacher_grade where grade_id in (select grade_id from mp_teacher_grade where id='"+req.query.id+"' and role_id='"+req.query.roleid+"'))";

 }
 else  if(req.query.roleid=="headofedn")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and id in(select name from tr_teacher_observation_flag where flag='1') and school_id='"+req.query.schoolid+"'  and role_id='subject-teacher'";
 }
  else  if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and id in(select name from tr_teacher_observation_flag where flag='0') and school_id='"+req.query.schoolid+"'  and role_id='subject-teacher'";
 }
 console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
     // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});
app.post('/observername-service' ,  urlencodedParser,function (req, res)
{ 
var observersid={name:req.query.id};
var observersid1={name:req.query.id1};
var observersid2={name:req.query.id2};
console.log(observersid);
console.log(observersid1);
console.log(observersid2);
var qur="select name,role_id from md_employee where (id='"+req.query.id+"' or id='"+req.query.id1+"' or id='"+req.query.id2+"') and role_id not in('subject-teacher')";
console.log('.................................................');
console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/observerdescriptor-service' ,  urlencodedParser,function (req, res)
{ 

connection.query("select * from md_observer_descriptor",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/teachergrade-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
else  if(req.query.roleid=="headofedn")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where grade_id in(select grade from tr_teacher_observation_flag where flag='1' and name='"+req.query.id+"') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
else  if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where grade_id in(select grade from tr_teacher_observation_flag where flag='0' and name='"+req.query.id+"') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/teachersection-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 var gradeid={grade_id:req.query.gradeid};
  if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
    qur="select  distinct section_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
 }
else if(req.query.roleid=="headofedn")
 {
  qur="select  distinct section_id from mp_teacher_grade where section_id in (select section from tr_teacher_observation_flag where name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and flag='1') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select  distinct section_id from mp_teacher_grade where section_id in (select section from tr_teacher_observation_flag where name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and flag='0') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/teachersubject-service' ,  urlencodedParser,function (req, res)
{ 
    var qur;
var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 var gradeid={grade_id:req.query.gradeid};
 var sectionid={section_id:req.query.sectionid};
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
qur= "select  DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="headofedn")
 {
qur= "select DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where  subject_id in (select subject from tr_teacher_observation_flag where flag='1' and name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionid+"') and  school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
qur= "select DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where  subject_id in(select subject from tr_teacher_observation_flag where flag='0' and name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionid+"') and  school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});



app.post('/observermarkflag-service' ,  urlencodedParser,function (req, res)
{ 
var schol={school_id:req.query.schoolid};
 var teacherid={name:req.query.id};
 var gradeid={grade:req.query.gradeid};
 var sectionid={section:req.query.sectionid};
 var subjectid={subject:req.query.subjectid};
connection.query("select * from tr_teacher_observation_flag where ? and ? and ? and ? and ?",[schol,teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/observerscore-service',  urlencodedParser,function (req, res)
{  
  var response={
         
         description_id:req.query.desid,
         score:req.query.score,
         teacher_id:req.query.teacherid,
         observer_id:req.query.observerid,
         role:req.query.roleid,
         grade:req.query.grade,
         section:req.query.section,
         subject:req.query.subject,   
                              
  }
  connection.query("INSERT INTO tr_teacher_observation_mark set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fnstn-service' ,urlencodedParser,function (req, res)
{ 
 var teacherid={tracher_id:req.query.staffid};
 var gradeid={grade:req.query.grid};
 var sectionid={section:req.query.secid};
 var subjectid={subject:req.query.sid};
  // console.log(teacherid);
  // console.log(gradeid);
  // console.log(sectionid);
  // console.log(subjectid);


connection.query("select * from tr_teacher_observation_strength where ? and ? and ? and ?",[teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/fnstrength-service',  urlencodedParser,function (req, res){


  var response={  
     role:req.query.rid,
     observer_id:req.query.obid,
     tracher_id:req.query.staffid,
     grade:req.query.grid,
     section:req.query.secid,
     subject:req.query.sid,
     Strength:req.query.Strength, 
     Areas:req.query.Areas,   
     Innovation:req.query.Innovation,
     comment:req.query.comment,              
                   
  }
  //console.log(response);
  connection.query("INSERT INTO tr_teacher_observation_strength set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/observerinsertflag-service',  urlencodedParser,function (req, res)
{  
  var response={
         
         school_id:req.query.schoolid,
         name:req.query.id,
         grade:req.query.gradeid,
         section:req.query.sectionid,
         subject:req.query.subjectid,
         flag:req.query.flag                    
  }
  connection.query("INSERT INTO tr_teacher_observation_flag set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/observerupdateflag-service',  urlencodedParser,function (req, res)
{  
       
       var schol= {school_id:req.query.schoolid};
       var name={name:req.query.id};
       var grade={grade:req.query.gradeid};
        var section={section:req.query.sectionid};
        var subject={subject:req.query.subjectid};
        var flag={flag:req.query.flag};                    
  
  connection.query(" update tr_teacher_observation_flag set ? where ? and ? and ? and ? and ?",[flag,schol,name,grade,section,subject],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchobservermark-service' ,  urlencodedParser,function (req, res)
{ 
 var teacherid={teacher_id:req.query.id};
 var gradeid={grade:req.query.gradeid};
 var sectionid={section:req.query.sectionid};
 var subjectid={subject:req.query.subjectid};
connection.query("select * from tr_teacher_observation_mark where ? and ? and ? and ?",[teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});
app.post('/mailreportcard-service' ,  urlencodedParser,function (req, res)
{
        var adterm1="";
        var adterm2="";
        var adterm3="";
        var wdterm1="";
        var wdterm2="";
        var wdterm3="";
        var pterm1="";
        var pterm2="";
        var pterm3="";
        var t1height="";
        var t2height="";
        var t3height="";
        var t1weight="";
        var t2weight="";
        var t3weight="";
        var generic="";
        var specific="";

        var img1="./app/images/"+req.query.loggedid+req.query.schoolid+".jpg";
        var img2="./app/images/principal"+req.query.schoolid+".jpg";

        console.log('.........................healthattendanceinfo....................................');
   console.log(global.attendanceinfo.length);
  console.log(global.healthinfo.length);
        console.log('.................................................................................');


     for(var i=0;i<global.attendanceinfo.length;i++){
        if((global.attendanceinfo[i].term_id).toLowerCase()=="term1"){
        adterm1=global.attendanceinfo[i].attendance;
        wdterm1=global.attendanceinfo[i].working_days;
       pterm1=parseFloat((global.attendanceinfo[i].attendance/global.attendanceinfo[i].working_days)*100).toFixed(2)+"%";
       generic=global.attendanceinfo[i].generic; 
       specific=global.attendanceinfo[i].speccomment; 
        }
        if((global.attendanceinfo[i].term_id).toLowerCase()=="term2"){
       adterm2=global.attendanceinfo[i].attendance;
        wdterm2=global.attendanceinfo[i].working_days;
     pterm2=parseFloat((global.attendanceinfo[i].attendance/global.attendanceinfo[i].working_days)*100).toFixed(2)+"%";
     generic=global.attendanceinfo[i].generic; 
     specific=global.attendanceinfo[i].speccomment; 
        }
        if((global.attendanceinfo[i].term_id).toLowerCase()=="term3"){
        adterm3=global.attendanceinfo[i].attendance;
        wdterm3=global.attendanceinfo[i].working_days;
        pterm3=parseFloat((global.attendanceinfo[i].attendance/global.attendanceinfo[i].working_days)*100).toFixed(2)+"%";
        generic=global.attendanceinfo[i].generic; 
        specific=global.attendanceinfo[i].speccomment; 
        }
        }
        for(var i=0;i<global.healthinfo.length;i++){
        if((global.healthinfo[i].term_id).toLowerCase()=="term1"){
         t1height=global.healthinfo[i].height+" cm";
         t1weight=global.healthinfo[i].weight+" Kg";  
        }
        if((global.healthinfo[i].term_id).toLowerCase()=="term2"){
        t2height=global.healthinfo[i].height+" cm";
        t2weight=global.healthinfo[i].weight+" Kg";  
        }
        if((global.healthinfo[i].term_id).toLowerCase()=="term3"){
       t3height=global.healthinfo[i].height+" cm";
        t3weight=global.healthinfo[i].weight+" Kg";  
        }
        }       
        









        var engarr=[];
        var matharr=[];
        var evsarr=[];
        var hinarr=[];
        var comarr=[];
        var gkarr=[];
        var acarr=[];
        var mdarr=[];
        var gamearr=[];
        var parr=[];
        var dancearr=[];
        
        for(var i=0;i<global.scholasticinfo.length;i++){          
          var obj={"category":"","t1grade":"","t2grade":"","t3grade":"","comment":""};          
          if(global.scholasticinfo[i].subject_name=="English"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;    
            engarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="Mathematics"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            matharr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="EVS"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            evsarr.push(obj);
          }
          if((global.scholasticinfo[i].subject_name).trim()=="II Language Hindi"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            hinarr.push(obj);
          }
        if((global.scholasticinfo[i].subject_name).trim()=="II Language Kannada"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            hinarr.push(obj);
          }
          if((global.scholasticinfo[i].subject_name).trim()=="Computer"){            
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            comarr.push(obj);            
          }          
          if(global.scholasticinfo[i].subject_name=="GK"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            gkarr.push(obj);
          }          
                   
          if(global.scholasticinfo[i].subject_name=="Art&Craft"){            
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;     
            acarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="music"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            mdarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="dance"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            dancearr.push(obj);
          }

          if(global.scholasticinfo[i].subject_name=="Games"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="Term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="Term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            gamearr.push(obj);
          }

        if(global.scholasticinfo[i].subject_name=="Personality Development"){ 
          obj.category=global.scholasticinfo[i].category; 
          obj.comment=global.scholasticinfo[i].description;      
          if(global.scholasticinfo[i].term_name=="Term1"){            
          obj.t1grade=global.scholasticinfo[i].term_cat_grade;
          }
          if(global.scholasticinfo[i].term_name=="Term2"){            
          obj.t2grade=global.scholasticinfo[i].term_cat_grade;
          }
          if(global.scholasticinfo[i].term_name=="Term3"){            
          obj.t3grade=global.scholasticinfo[i].term_cat_grade;
          }
          parr.push(obj);          
        }
       }



       var et1="";
       var et2="";
       var et3="";
       var mt1="";
       var mt2="";
       var mt3="";
       var evt1="";
       var evt2="";
       var evt3="";
       var ht1="";
       var ht2="";
       var ht3="";
       var ct1="";
       var ct2="";
       var ct3="";
       var gt1="";
       var gt2="";
       var gt3="";
       var at1="";
       var at2="";
       var at3="";
       var mdt1="";
       var mdt2="";
       var mdt3="";
       var gat1="";
       var gat2="";
       var gat3="";
       var pdt1="";
       var pdt2="";
       var pdt3="";
       var dant1="";
       var dant2="";
       var dant3="";
       for(var i=0;i<global.overalltermwisegrade.length;i++){
                  
          if(global.overalltermwisegrade[i].subject_id=="English"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            et1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            et2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            et3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Mathematics"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            mt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            mt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            mt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="EVS"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            evt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            evt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            evt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if((global.overalltermwisegrade[i].subject_id).trim()=="II Language Hindi"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            ht1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            ht2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            ht3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if((global.overalltermwisegrade[i].subject_id).trim()=="II Language Kannada"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            ht1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            ht2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            ht3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Computer"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            ct1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            ct2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            ct3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="GK"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            gt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            gt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            gt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Art&Craft"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            at1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            at2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            at3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="music"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            mdt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            mdt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            mdt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="dance"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            dant1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            dant2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            dant3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Games"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            gat1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            gat2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            gat3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Personality Development"){      
            if(global.overalltermwisegrade[i].term_name=="Term1")
            pdt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term2")
            pdt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="Term3")
            pdt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          }
         

    console.log('....................schoolname.........................');
    console.log(req.query.schoolname+"   "+req.query.academicyear); 
    console.log('.......................................................');
    var header = "<table class='logo' style='width:100%;height: 15%; margin-top: 2%;'><tr><th><img src='./app/images/zeesouth.png' height='100px' width='100px'></img></th><th>"
    header += "<img src='./app/images/mount.png' height='110px' width='200px' style='margin-left:100px'></img><center><p>"+req.query.schoolname+"</p>ACHIEVEMENT RECORD("+req.query.academicyear+")</center></th>"
    header += "<th><img src='./app/images/zee.gif' height='100px' width='100px'></img></th></tr></table><br>"
    header += "<div class='saph' style='margin-left: 3%;'><img src='./app/images/saph.jpg' height='120px' width='630px'></img></div>";

    var studinfo= "<table class='studentinfo' style='border-collapse: collapse;width:95%;height: 10%;margin-left: 3%;margin-top: 2%;'><tr><th align='left'>Student Name: </th>"
    studinfo += "<th align='left' colspan='3' style='background-color: white;'>"+global.studentinfo[0].student_name+"</th></tr><tr style='height: 10px;'><th colspan='4'></th></tr><tr>"
    studinfo += "<th align='left'>Parent Name: </th><th align='left' colspan='3' style='background-color: white;'>"+global.studentinfo[0].parent_name+"</th></tr><tr style='height: 10px;'><th colspan='4'></th></tr><tr><th align='left'>Class: </th>";    
    studinfo += "<th align='left'>Admission No: </th><th align='left' style='background-color: white;'>"+global.studentinfo[0].student_id+"</th></tr></table> <br><br><br>";
     
    var attendance= "<table style='border-collapse: collapse;width:95%;height: 15%; margin-left: 3%;margin-top: 2%;' class='attendance'><tr><th style='width: 25%;'>Attendance</th><th colspan='2' style='width: 25%;'>Term1</th><th colspan='2' style='width: 25%;'>Term2</th><th colspan='2' style='width: 25%;'>Term3</th></tr>"
    attendance += "<tr style='height: 10px;'><th colspan='7'></th></tr><tr><td style='width: 25%;'>Total Attended Days</td><td align='right' style='width: 13%;'>"+adterm1+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm1+"</div></td><td align='right' style='width: 13%;'>"+adterm2+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm2+"</div></td><td align='right' style='width: 13%;'>"+adterm3+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm3+"</div></td></tr><tr style='height: 10px;'><th colspan='7'></th></tr>"
    attendance += "<tr><td style='width: 25%;'>Total Working Days</td><td align='right' style='width: 13%;'>"+wdterm1+"</td>"
    attendance += "<td align='right' style='width: 13%;'>"+wdterm2+"</td><td align='right' style='width: 13%;'>"+wdterm3+"</td></tr></table><br><br><br>"
    attendance += "<table  style='width: 95%;margin-left: 3%;' class='general'> <tr><th style='width: 25%;'>General Feedback: </th><th style='background-color: white;'>"+generic+"</th></tr></table><br><br>"
    attendance += "<table  style='width: 95%;margin-left: 3%;' class='specific'> <tr><th style='width: 25%;'>Specific Feedback: </th><th style='background-color: white;'>"+specific+"</th></tr></table><br><br><br><br><br>";


    var signature= "<table  style='width: 650px;margin-left:10px;' class='signature'>"
    signature +="<tr><th style='text-align:center;'><img width='100px' height='45px' src='"+img1+"'></th><th width='100px'></th><th style='text-align:center;'><img width='100px' height='45px' src='"+img2+"'></th><th></th></tr>"
    signature += "<tr><th>-----------------------------------</th><th></th><th>-----------------------------------</th><th></th>"
    signature += "<th>------------------------------------</th><th></th></tr><tr><th><center>Class Teacher</center></th><th></th><th><center>Principal</center></th><th></th><th><center>Parent</center></th><th></th></tr></table><br><br><br><br>";

    console.log('signature done....');

    var clr;
    var subjecteng = "<table style='width: 95%;margin-left:3%;page-break-after: always; ' class='subject'><tr style='background: #4d94ff;'><th style='width: 35%;'>ENGLISH</th><th style='width:5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width:50%;'>Comments</th></tr>"
    subjecteng += "<tr style='background: #4d94ff;'><th style='width: 35%;text-align: center;'></th><th style='width:5%;text-align:center;'>"+et1+"</th><th style='width: 5%;text-align: center;' >"+et2+"</th><th style='width: 5%;text-align: center;'>"+et3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<engarr.length; i++) {
    if(i%2!=0){
    subjecteng += "<tr class='eng' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+engarr[i].category+"</th><th style='width: 5%;'>"
    subjecteng += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+engarr[i].comment+"</th></tr>"  
    }else{ 
    subjecteng += "<tr class='eng' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+engarr[i].category+"</th><th style='width: 5%;'>"
    subjecteng += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+engarr[i].comment+"</th></tr>"
    }
    }
    subjecteng += "</table>";

    console.log('eng done....');

    var subjectmath = "<table style='width: 95%;margin-left: 3%;page-break-after: always;' class='subject'><tr style='background: #86b300;'><th style='width: 35%;' >MATHEMATICS</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectmath += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+mt1+"</th><th style='width: 5%;text-align:center;'>"+mt2+"</th><th style='width: 5%;text-align: center;'>"+mt3+"</th><th style='width:50%;text-align: left;'></th></tr>"
    for(var i=0; i<matharr.length; i++) {
    if(i%2!=0)
    {
    subjectmath += "<tr class='math' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+matharr[i].category+"</th><th style='width: 5%;'>"
    subjectmath += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+matharr[i].comment+"</th></tr>"
    }
    else{
    subjectmath += "<tr class='math' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+matharr[i].category+"</th><th style='width: 5%;'>"
    subjectmath += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+matharr[i].comment+"</th></tr>"
    }
    }
    subjectmath += "</table>";

    console.log('math done....');

    var subjectevs = "<table style='width: 95%;margin-left: 3%; page-break-after: always;' class='subject'><tr style='background: #ffad33;'><th style='width: 35%;'>EVS</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectevs += "<tr style='background: #ffad33;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+evt1+"</th><th style='width: 5%;text-align: center;'>"+evt2+"</th><th style='width: 5%;text-align: center;'>"+evt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<evsarr.length; i++) {
    if(i%2!=0)
    subjectevs += "<tr class='evs' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+evsarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+evsarr[i].comment+"</th></tr>"
    else
    subjectevs += "<tr class='evs' style='background:#ffd699'><th style='width: 35%;text-align: left;'>"+evsarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+evsarr[i].comment+"</th></tr>"
    }
    subjectevs += "</table>";

    console.log('evs done....');

    var subjecthindi = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #ac39ac;'><th style='width: 35%;'>HINDI/KANNADA(II Language)</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjecthindi += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+ht1+"</th><th style='width: 5%;text-align: center;'>"+ht2+"</th><th style='width: 5%;text-align: center;'>"+ht3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<hinarr.length; i++) {
    if(i%2!=0)
    subjecthindi += "<tr class='hin' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+hinarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+hinarr[i].comment+"</th></tr>"
    else
    subjecthindi += "<tr class='hin' style='background:#d98cd9'><th style='width: 35%;text-align: left;'>"+hinarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+hinarr[i].comment+"</th></tr>"
    }
    subjecthindi += "</table>";

    console.log('hindi done....');

    var subjectcomputer = "<table style='width: 95%;margin-left: 3%;page-break-after: always;' class='subject'><tr style='background: #4d94ff;'><th style='width: 35%;'>COMPUTER SCIENCE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectcomputer += "<tr style='background: #4d94ff;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+ct1+"</th><th style='width: 5%;text-align: center;'>"+ct2+"</th><th style='width: 5%;text-align: center;'>"+ct3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<comarr.length; i++) {
    if(i%2!=0)
    subjectcomputer += "<tr class='comp' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+comarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+comarr[i].comment+"</th></tr>"
    else
    subjectcomputer += "<tr class='comp' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+comarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+comarr[i].comment+"</th></tr>"
    }
    subjectcomputer += "</table>";

    console.log('computer done....');

    var subjectgk = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #ac39ac;'><th style='width: 35%;'>GENERAL KNOWLEDGE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectgk += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+gt1+"</th><th style='width: 5%;text-align: center;'>"+gt2+"</th><th style='width: 5%;text-align: center;'>"+gt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<gkarr.length; i++) {
    if(i%2!=0)
    subjectgk += "<tr class='gk' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+gkarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gkarr[i].comment+"</th></tr>"
    else
    subjectgk += "<tr class='gk' style='background:#ffd699'><th style='width: 35%;text-align: left;'>"+gkarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gkarr[i].comment+"</th></tr>"
    }
    subjectgk += "</table>";

    console.log('gk done....');

    var subjectartcraft = "<table style='width: 95%;margin-left: 3%;' class='subject'> <tr style='background: #86b300;'><th style='width: 35%;'>ART/CRAFT</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectartcraft += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+at1+"</th><th style='width: 5%;text-align: center;'>"+at2+"</th><th style='width: 5%;text-align: center;'>"+at3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<acarr.length; i++) {
    if(i%2!=0)
    subjectartcraft += "<tr class='art' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+acarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+acarr[i].comment+"</th></tr>"
    else
    subjectartcraft += "<tr class='art' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+acarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+acarr[i].comment+"</th></tr>"
    }
    subjectartcraft += "</table>";

    console.log('artcraft done....');

    var subjectmusic = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #ac39ac;'><th style='width: 35%;'>MUSIC</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectmusic += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+mdt1+"</th><th style='width: 5%;text-align: center;'>"+mdt2+"</th><th style='width: 5%;text-align: center;'>"+mdt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<mdarr.length; i++) {
    if(i%2!=0)
    subjectmusic += "<tr class='music' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+mdarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+mdarr[i].comment+"</th></tr>"
    else
    subjectmusic += "<tr class='music' style='background:#d98cd9'><th style='width: 35%;text-align: left;'>"+mdarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+mdarr[i].comment+"</th></tr>"
    }
    subjectmusic += "</table>";

    console.log('music done....');

    var subjectdance = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #ffad33;'><th style='width: 35%;'>DANCE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectdance += "<tr style='background: #ffad33;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+dant1+"</th><th style='width: 5%;text-align: center;'>"+dant2+"</th><th style='width: 5%;text-align: center;'>"+dant3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<dancearr.length; i++) {
    if(i%2!=0)
    subjectdance += "<tr class='music' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+dancearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+dancearr[i].comment+"</th></tr>"
    else
    subjectdance += "<tr class='music' style='background:#ffad33'><th style='width: 35%;text-align: left;'>"+dancearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+dancearr[i].comment+"</th></tr>"
    }
    subjectdance += "</table>";

    var subjectgames = "<table style='width: 95%;margin-left: 3%;page-break-after: always;' class='subject'> <tr style='background: #4d94ff;'><th style='width: 35%;'>GAMES</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectgames += "<tr style='background: #4d94ff;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+gat1+"</th><th style='width: 5%;text-align: center;'>"+gat2+"</th><th style='width: 5%;text-align: center;'>"+gat3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<gamearr.length; i++) {
    if(i%2!=0)
    subjectgames += "<tr class='game' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+gamearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gamearr[i].comment+"</th></tr>"
    else
    subjectgames += "<tr class='game' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+gamearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gamearr[i].comment+"</th></tr>"
    }
    subjectgames += "</table>";

    console.log('games done....');

    var subjectpersonality = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #86b300;'><th style='width: 35%;'>PERSONALITY DEVELOPMENT</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectpersonality += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+pdt1+"</th><th style='width: 5%;text-align: center;'>"+pdt2+"</th><th style='width: 5%;text-align: center;'>"+pdt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<parr.length; i++) {
    if(i%2!=0)
    subjectpersonality += "<tr class='pd' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+parr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+parr[i].comment+"</th></tr>"
    else
    subjectpersonality += "<tr class='pd' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+parr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+parr[i].comment+"</th></tr>"
    }
    subjectpersonality += "</table>   <br><br><br>";

    var health = "<table class='health' border='1' style='border-collapse: collapse;width: 95%;margin-left: 3%;'><tr style='background: #ac39ac;'><th>Health</th><th>T1</th><th>T2</th><th>T3</th></tr>"
    health += "<tr class='health'><th>Height</th><th>"+t1height+"</th><th>"+t2height+"</th><th>"+t3height+"</th></tr>"
    health += "<tr class='health'><th>Weight</th><th>"+t1weight+"</th><th>"+t2weight+"</th><th>"+t3weight+"</th></tr></table><br><br>";

    // $('tr:nth-child(even)').css("background", "red");
    var final="<div style=' width:660px;border:1px solid black;margin-left: 3%; font-family: Arial, Helvetica, sans-serif;'>"+header+studinfo+attendance+signature+subjecteng+subjectmath+subjectevs+subjecthindi+subjectcomputer+subjectgk+subjectartcraft+subjectmusic+subjectdance+subjectgames+subjectpersonality+health+"</div>";

      console.log('pd done....');
  var finalpdf=final;
   /* var base64data = new Buffer(finalpdf, 'binary');
    var s3 = new AWS.S3();
   s3.putObject({
     Bucket: 'samsidhreportcard',
     Key: 'reportcard.pdf',
     Body: base64data
   },function (resp) {
     console.log(arguments);
     console.log('Successfully uploaded package.');
     res.status(200).json({'returnval': 'converted'});   
   });
*/
    htmlToPdf.convertHTMLString(finalpdf, './app/reportcard/'+global.studentinfo[0].student_name+'.pdf',
    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
        //  logfile.write('pdf write:success\n\n');
          console.log('Converted');
          res.status(200).json({'returnval': 'converted'});     
   // fs.readFile('./app/reportcard/'+global.studentinfo[0].student_name+'.pdf', function (err, data) {
   // if (err) { throw err; }
   // var base64data = new Buffer(data, 'binary');
   // var s3 = new AWS.S3();
   // s3.putObject({
   //   Bucket: 'samsidh-helpdesk',
   //   Key: 'reportcard.pdf',
   //   Body: base64data
   // },function (resp) {
   //   console.log(arguments);
   //   console.log('Successfully uploaded package.');
   //   res.status(200).json({'returnval': 'converted'});   
   // });
  // });    
        }
    });
});

app.post('/fmailreportcard-service' ,  urlencodedParser,function (req, res)
{
        var adterm1="";
        var adterm2="";
        var adterm3="";
        var wdterm1="";
        var wdterm2="";
        var wdterm3="";
        var pterm1="";
        var pterm2="";
        var pterm3="";
        var t1height="";
        var t2height="";
        var t3height="";
        var t1weight="";
        var t2weight="";
        var t3weight="";
        var generic="";
        var specific="";
        var subjectarr=[];
        var finalarr=[];
        var marks=[];
        var submarks=[];
        var co_lower=[];
        var co_higher=[];
        var co_grade=[];
        var returnval1=global.coscholasticgrade; 
              
          for(var i=0;i<returnval1.length;i++){
          co_lower.push(returnval1[i].lower_limit);
          co_higher.push(returnval1[i].higher_limit);
          co_grade.push(returnval1[i].grade);
        }

        var img1="./app/images/"+req.query.loggedid+req.query.schoolid+".jpg";
        var img2="./app/images/principal"+req.query.schoolid+".jpg";

        var logo1="./app/images/zeesouth.png";
        console.log('asa');
      /*console.log('.........................healthattendanceinfo....................................');
        console.log(global.healthattendanceinfo.length);
        console.log('.................................................................................');

        if(global.healthattendanceinfo.length==1||global.healthattendanceinfo.length==2||global.healthattendanceinfo.length==3){
        adterm1=global.healthattendanceinfo[0].attendance;
        wdterm1=global.healthattendanceinfo[0].working_days;
        pterm1=parseFloat((global.healthattendanceinfo[0].attendance/global.healthattendanceinfo[0].working_days)*100).toFixed(2)+"%";
        t1height=global.healthattendanceinfo[0].height+"cm";
        t1weight=global.healthattendanceinfo[0].weight+"kg"; 
        generic=global.healthattendanceinfo[0].generic; 
        specific=global.healthattendanceinfo[0].speccomment;        
        }
        if(global.healthattendanceinfo.length==2){
        adterm2=global.healthattendanceinfo[1].attendance;
        wdterm2=global.healthattendanceinfo[1].working_days;
        pterm2=parseFloat((global.healthattendanceinfo[1].attendance/global.healthattendanceinfo[1].working_days)*100).toFixed(2)+"%";
        t2height=global.healthattendanceinfo[1].height+"cm";
        t2weight=global.healthattendanceinfo[1].weight+"kg";
        generic=global.healthattendanceinfo[1].generic; 
        specific=global.healthattendanceinfo[1].speccomment; 
        }*/
       subjectarr=global.subjectinfo;
      var arr=global.fetchmark;
        for(var i=0;i<subjectarr.length;i++){
          var obj={"subject_name":"","FA1":"","FA2":"","SA1":"","tot1":"","FA3":"","FA4":"","SA2":"","tot2":"","FA":"","SA":"","grade":"","point":""};
          this.no=0;
          var flag=0;
          for(var j=0;j<arr.length;j++){
            this.no=parseInt(this.no)+1;
            if(subjectarr[i].subject_name==arr[j].subject_id){
              flag=1;
              obj.subject_name=arr[j].subject_id;
              if(arr[j].category=='FA1'){                
                obj.FA1=arr[j].cat_grade;                
                this.m1=arr[j].total;
              }
              else if(arr[j].category=='FA2'){                
                obj.FA2=arr[j].cat_grade;
                this.m2=arr[j].total;
              }
              else if(arr[j].category=='SA1'){                
                obj.SA1=arr[j].cat_grade;
                this.sm1=arr[j].total;
              }
              else if(arr[j].category=='FA3'){                
                obj.FA3=arr[j].cat_grade;
                this.m3=arr[j].total;
              }
              else if(arr[j].category=='FA4'){                
                obj.FA4=arr[j].cat_grade;
                this.m4=arr[j].total;
              }              
              else if(arr[j].category=='SA2'){                
                obj.SA2=arr[j].cat_grade;
                this.sm2=arr[j].total;
              }
            
              
          }
        }
        console.log('come');
          if(flag==1){
            var t1=parseFloat(((parseFloat(this.m1)+parseFloat(this.m2)+(3*parseFloat(this.sm1)))*2)/10).toFixed(1);
              if(t1>=9.1&&t1<=10)
                obj.tot1='A1';
              if(t1>=8.1&&t1<=9)
                obj.tot1='A2';
              if(t1>=7.1&&t1<=8)
                obj.tot1='B1';
              if(t1>=6.1&&t1<=7)
                obj.tot1='B2';
              if(t1>=5.1&&t1<=6)
                obj.tot1='C1';
              if(t1>=4.1&&t1<=5)
                obj.tot1='C2';
              if(t1>=3.3&&t1<=4)
                obj.tot1='D';
              if(t1>=2.1&&t1<=3.2)
                obj.tot1='E1';
              if(t1>=0&&t1<=2)
                obj.tot1='E2';
              var fatot=parseFloat((parseFloat(this.m1)+parseFloat(this.m2))/2).toFixed(1);
              if(fatot>=9.1&&fatot<=10)
                obj.FA='A1';
              if(fatot>=8.1&&fatot<=9)
                obj.FA='A2';
              if(fatot>=7.1&&fatot<=8)
                obj.FA='B1';
              if(fatot>=6.1&&fatot<=7)
                obj.FA='B2';
              if(fatot>=5.1&&fatot<=6)
                obj.FA='C1';
              if(fatot>=4.1&&fatot<=5)
                obj.FA='C2';
              if(fatot>=3.3&&fatot<=4)
                obj.FA='D';
              if(fatot>=2.1&&fatot<=3.2)
                obj.FA='E1';
              if(fatot>=0&&fatot<=2)
                obj.FA='E2';
              var satot=parseFloat(this.sm1).toFixed(1);
              if(satot>=9.1&&satot<=10)
                obj.SA='A1';
              if(satot>=8.1&&satot<=9)
                obj.SA='A2';
              if(satot>=7.1&&satot<=8)
                obj.SA='B1';
              if(satot>=6.1&&satot<=7)
                obj.SA='B2';
              if(satot>=5.1&&satot<=6)
                obj.SA='C1';
              if(satot>=4.1&&satot<=5)
                obj.SA='C2';
              if(satot>=3.3&&satot<=4)
                obj.SA='D';
              if(satot>=2.1&&satot<=3.2)
                obj.SA='E1';
              if(satot>=0&&satot<=2)
                obj.SA='E2';
              var grand=parseFloat(((parseFloat(this.m1)+parseFloat(this.m2)+(3*parseFloat(this.sm1)))*2)/10).toFixed(1);
              if(grand>=9.1&&grand<=10){
                obj.grade='A1';
                obj.point='10.0';
              }
              if(grand>=8.1&&grand<=9){
                obj.grade='A2';
                obj.point='9.0';
              }
              if(grand>=7.1&&grand<=8){
                obj.grade='B1';
                obj.point='8.0';
              }
              if(grand>=6.1&&grand<=7){
                obj.grade='B2';
                obj.point='7.0';
              }
              if(grand>=5.1&&grand<=6){
                obj.grade='C1';
                obj.point='6.0';
              }
              if(grand>=4.1&&grand<=5){
                obj.grade='C2';
                obj.point='5.0';
              }
              if(grand>=3.3&&grand<=4){
                obj.grade='D';
                obj.point='4.0';
              }
              if(grand>=2.1&&grand<=3.2){
                obj.grade='E1';
                obj.point='3.0';
              }
              if(grand>=0&&grand<=2){
                obj.grade='E2'; 
                obj.point='2.0';                         
              }
              finalarr.push(obj); 
            }}
        var lsarr=[];
        var wkarr=[];
        var vparr=[];
        var avarr=[];
        var ccarr=[];
        var hparr=[];
        var k;
        marks=global.coscholasticinfo;
       submarks=global.scholasticinfo;

         for(var i=0;i<submarks.length;i++){
          var obj={"catcheck":"","subject":"","category":"","grade":"","t1grade":"","t2grade":"","t3grade":"","comment":""};          
          if(submarks[i].subject_name=="Life Skills"){
            
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            lsarr.push(obj);
          }
           if(submarks[i].subject_name=="Work Education"){
           
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            wkarr.push(obj);
          }
           if(submarks[i].subject_name=="Visual & Performing Arts"){
            // alert('yes');
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            // obj.catcheck=submarks[i].category;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            vparr.push(obj);
          }
           if(submarks[i].subject_name=="Attitudes And values"){
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            avarr.push(obj);
          }
           if(submarks[i].subject_name=="Co-Curricular Activities"){
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            ccarr.push(obj);
          }
           if(submarks[i].subject_name=="Health and Physical Education"){
            // alert('yes');
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            // obj.catcheck=submarks[i].category;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="Term3")
            obj.t3grade=submarks[i].category_grade;    
            hparr.push(obj);
          }
        }
       
    console.log('....................schoolname.........................');
    console.log(req.query.schoolname+"   "+req.query.academicyear); 
    console.log('.......................................................');
    var header="<div class='bbox' style='position: relative;width: 639px;height: 930px;border: 10px solid green;left: 20px;margin-top:1%;' id='fivescorecard'><div class='relative' style='position: relative;width: 500px;height: 200px;border: 3px solid black;margin-left:15%;margin-top:2%;'>"
      /*header+="<img src='../../images/zeesouth.png' height='100px' width='90px'/>"*/

      header+="<img style='width:90px;height:100px;margin-left:-20%;' src='"+logo1+"'>"

      header+="<table border='0' class='scoretbl' style='position:relative;width: 500px;height: 100px;text-align: left;margin-top:-23%;'>"
      header+="<tr><th colspan='3'><h2><center>"+req.query.schoolname+"</center></h2></th></tr>"
      header+="<tr><th colspan='3'><center>"+req.query.schooladdress+"</center></th></tr>"
      header+="<tr><th>Affiliation No:</th><th colspan='2'>&nbsp;"+req.query.affno+"</th></tr>" 
      header+="<tr><th> Email Id:</th><th colspan='2'>"+req.query.email+"</th></tr>"
       header+="<tr><th> Website:</th><th>"+req.query.website+"</th><th>Phone No :"+req.query.phno+"</th></tr></table></div>";
     var studentprofile="<div class='absolute' style='position: absolute;top: 50px;width: 110px; height: 100px;left: 50px;'><img src='../../images/zeesouth.png' height='100px' width='90px'/></div>"
     studentprofile+="<div class='pr' style='position: relative;width: 700px;height: 100px;margin-left:-1%;margin-top:-2%;'><center><h2>PERFORMANCE PROFILE</h2><h4 style='margin-top:-2%;'>Class:"+req.query.grade+" (Session: "+req.query.academicyear+")</h4><h3 style='margin-top:-1%;'>CONTINUOUS AND COMPREHENSIVE EVALUATION </h3>"
     studentprofile+="<h4 style='margin-left:-6%;margin-top:-2%;'>(Issued by School as per directives of Central Board of Secondary Educational, Delhi)</h4> </center></div>"
     studentprofile+="<div class='stupr' style='position: relative;width: 680px;left: 50px;margin-top:-3%;'><h3>Student Profile</h3></div> <table  class='tbl1'  style=' position: relative;text-align: left;left: 50px;margin-top:-3%;' cellspacing='9'>"
     studentprofile+="<tr ><th>Admission No.</th><th>:</th><th>"+global.studentinfo[0].student_id+"</th></tr><tr><td>(allotted by the school)</td></tr>"
     studentprofile+="<tr ><th>Name </th><th>:</th><th>"+global.studentinfo[0].student_name+"</th></tr><tr><th>Date of Birth </th> <th>:</th><th>"+global.studentinfo[0].dob+"</th></tr>"
     studentprofile+="<tr ><th>Mother's Name</th><th>:</th><th>"+global.studentinfo[0].mother_name+"</th></tr><tr > <th>Father's Name </th><th>:</th><th>"+global.studentinfo[0].parent_name+"</th></tr>"
     studentprofile+="<tr rowspan='2'><th>Residential Address </th><th>:</th><th>"+global.studentinfo[0].address1+" "+global.studentinfo[0].address2+" "+global.studentinfo[0].address3+" "+global.studentinfo[0].city+" "+global.studentinfo[0].pincode+"</th></tr><tr><th>Telephone No </th><th>:</th><th>"+global.studentinfo[0].mobile+"</th></tr></table>"  

     studentprofile+="<table class='attable' style='position: relative;text-align: left;width: 700px;left: 50px;margin-top:-1%;'><tr height='25px'><th width='250px'>Attendance:</th><th colspan='4'>Term1</th><th colspan='4'>Term2</th></tr>"
   studentprofile+="<tr></tr><tr height='25px'><th>Total attendance of the student</th><th colspan='7'>"+global.healthattendanceinfo[0].attendance+"</th><th colspan='3'>"+global.healthattendanceinfo[1].attendance+"</th></tr>"
     studentprofile+="<tr height='25px'><th> Total Working Days</th><th colspan='7'>"+global.healthattendanceinfo[0].working_days+"</th><th colspan='3'>"+global.healthattendanceinfo[1].working_days+"</th></tr></table>"
     studentprofile+="<br><br><table class='health' style=' position: relative;text-align: left;width: 510px;left: 10%;border: 1px solid black;margin-top:-5%;'><tr height='20px'><th colspan='3'> Health Status</th><th colspan='3'></th><th colspan='3'></th></tr>"
     studentprofile+="<tr></tr><tr height='22px'><th colspan='3'>Height </th><th>"+global.healthattendanceinfo[0].height+"</th><th colspan='7'>Weight </th><th>"+global.healthattendanceinfo[0].width+"</th><th colspan='3'></th></tr>"
     studentprofile+="<tr height='25px'><th colspan='3'>Blood Group </th><th>"+global.healthattendanceinfo[0].blood_group+"</th><th colspan='7'>Vision(L) </th><th>"+global.healthattendanceinfo[0].left_vision+"</th><th colspan='3'>(R) </th><th>"+global.healthattendanceinfo[0].right_vision+"</th></tr>"
     studentprofile+="<tr height='25px'><th colspan='3'>Dental Hygiene </th><th>"+global.healthattendanceinfo[0].dental+"</th><td colspan='7'></td><td colspan='3'></td></tr></table><br><br><br><br><br><br><br><br><br>";

 var signatures="<table  class='signature' style='margin-left: 11%;margin-top:-15%;'><tr><th><img src='"+img1+"' width='100px;height:30px;'></th><th></th><th></th><th><img src='"+img2+"' width='130px;height:40px;'></th><th></th><th></th><th></th></tr>"

    signatures+="<tr><th>---------------------------------</th><th></th><th></th><th>---------------------------------</th><th></th><th></th>"
    signatures+=" <th>----------------------------------</th><th></th><th></th></tr>"
    signatures+="<tr><th>Class Teacher</th><th></th><th></th><th>Principal</th><th></th><th></th><th>Parent</th><th></th><th></th></tr></table><br><br><br><br></div>";

var scholasticvalue="<div class='bbbox' style='position: relative; width: 614px; height: 3900px; border: 10px solid green;margin-left:1%;margin-top:1%;><table border='1'><tr><th colspan='16'> <h2>PART1-ACADEMIC PERFOMANCE: Scholastic Areas</h2></th></tr><br> "   
  scholasticvalue+= "<tr><th colspan='4'>Subject Code and Name</th><th colspan='4'>Term1(grade)</th><th colspan='4'>Term2(grade)</th><th colspan='4'>Overall Term1+Term2</th></tr><tr><th colspan='4'></th><th>FA1</th><th>FA2</th><th>SA1</th><th>TOT1</th><th>FA3</th><th>FA4</th><th>SA2</th><th>TOT2</th><th>FA</th><th>SA</th><th>Overallgrade</th><th>GradePoint(Gp)</th></tr>"
  for(var i=0;i<finalarr.length;i++)
  {
 scholasticvalue+= " <tr><td colspan='4'>"+finalarr[i].subject_name+"</td>"
   scholasticvalue+=  "<td>"+finalarr[i].FA1+"</td><td>"+finalarr[i].FA2+"</td><td>"+finalarr[i].SA1+"</td><td>"+finalarr[i].tot1+"</td>"
    scholasticvalue+= "<td>"+finalarr[i].FA3+"</td><td>"+finalarr[i].FA4+"</td><td>"+finalarr[i].SA2+"</td><td>"+finalarr[i].tot2+"</td>"
    scholasticvalue+= "<td>"+finalarr[i].FA+"</td><td>"+finalarr[i].SA+"</td><td>"+finalarr[i].grade+"</td><td>"+finalarr[i].point+"</td></tr>"
  }
    scholasticvalue+="<tr><th colspan='16'>CumlativeGradePointAverage<br>"
     scholasticvalue+="<p>CGPA is the average of grade point obtained in all the subjects excluding additional 6th subject as per Scheme of studies An indicative eqivalence of grade point and percentage of marks can be completed as-subject wise indicative percentage of markes=9.5*of the subject overallindicative percentage of mark=9.5*CGPA</p></th></tr>"
   scholasticvalue+="<tr><th colspan='16'><br><h2>part2- Co-Scholastic Areas</h2> </th></tr><tr><th colspan='16'>2(A) Life Skills</th></tr><tr><th colspan='8'>Life Skills</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<lsarr.length;i++)
  {
   scholasticvalue+="<tr><th colspan='8' style='text-align: left;'>"+lsarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+lsarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+lsarr[i].comment+"</th></tr>"
   }
    scholasticvalue+=" <tr><th colspan='16'>2(B) Work Education</th></tr><tr><th colspan='8'>Work Education</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<wkarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+wkarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+wkarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+wkarr[i].comment+"</th></tr>"
  }
  scholasticvalue+="  <tr><th colspan='16'>2(C)Visual And Performing Art</th></tr><tr><th colspan='8'>Visual And Performing Art</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"   
     for(var i=0;i<vparr.length;i++)
  {
  scholasticvalue+="  <tr><th colspan='8' style='text-align: left;'>"+vparr[i].category+"</th><th colspan='3' style='text-align: center;'>"+vparr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+vparr[i].comment+"</th></tr>"
    }
    
   scholasticvalue+=" <tr><th colspan='16'>2(D) Attitudes And Values</th></tr><tr><th colspan='8'>Attitudes And Values</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<avarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+avarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+avarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+avarr[i].comment+"</th></tr>"
    }
    
   scholasticvalue+=" <tr><th  colspan='16'><br><h2>Part-3:Co-Scholastic Activities</h2></th></tr><tr><th colspan='16'>3(A)Co-Curricular Activity</th></tr><tr><th colspan='8'>Co-Curricular Activity</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
     for(var i=0;i<ccarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+ccarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+ccarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+ccarr[i].comment+"</th></tr>"
    }

   scholasticvalue+=" <tr><th colspan='16'>3(B) Health & Physical Activities</th></tr><tr><th colspan='8'>Health & Physical Activities</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
     for(var i=0;i<hparr.length;i++)
  {
  scholasticvalue+="<tr><th colspan='8' style='text-align: left;'>"+hparr[i].category+"</th><th colspan='3' style='text-align: center;'>"+hparr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+hparr[i].comment+"</th></tr>"
    }
  scholasticvalue+="  <tr><th colspan='16'><h4>Result:Qualified/Eligiblefor Improvement of perfomance(EIOP)</h4></th> </tr><tr><th colspan='16'><h4>Self Awarness:</h4></th></tr><tr><th colspan='16'><br><h4>MyGoals:</h4></th></tr><tr><th colspan='16'><h4>MyStrengths:</h4></th></tr><tr><th colspan='16'><h4>MyInterest and Hobbies</h4></th></tr><tr><th colspan='16'><h4>ResposibilityDischarge/ExceptionalAchievements</h4></th></tr></table></div>";


    console.log('pd done....');


    var finalpdf=header+studentprofile+signatures+scholasticvalue;
    // console.log("....................................");
          console.log(finalpdf);

    htmlToPdf.convertHTMLString(finalpdf, './app/reportcard/'+global.studentinfo[0].student_name+'.pdf',
    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
         //logfile.write('pdf write:success\n\n');
          console.log('Converted');
          res.status(200).json({'returnval': 'converted'});     
        }
    });
});




/*app.post('/sendmail-service', urlencodedParser,function (req, res) {

sg.API(request, function(err, response) {
    console.log(err, response);
    if (!err) {
        res.send({
            message: 'An email has been sent to the provided email with further instructions.'
        });
    } else {
        return res.status(400).send({
            message: 'Failure sending email'
        });
    }
});
});
*/
 
app.post('/sendmail-service', urlencodedParser,function (req, res){
   console.log(req.query.parentmail+"  "+req.query.secmail);
  var secmail=req.query.secmail;
  var server  = email.server.connect({
   user:    "samsidhschools@gmail.com",
   password:"zeeschool",
   host:    "smtp.gmail.com",
   ssl:     true
  });
  server.send({
   text:    "Report Card",
   from:    "samsidhschools@gmail.com",
   to:      req.query.parentmail,
  
   subject: "Term Report Card",
   text: "Dear Parent,"+"\n\n"+"Enclosed please find the report card of your ward.Kindly do not reply to this mail id.But you may contact the class teacher in case of any query."+"\n\n\n"+"Thanks&Regards,"+"\n"+"Class Teacher",
   attachment:
   [{
    name: 'Reportcard- '+global.studentinfo[0].student_name,
    filename: 'reportcard.pdf',
    path: './app/reportcard/'+global.studentinfo[0].student_name+'.pdf',
    type: 'application/pdf'
   }]
  },function(err, message) { 
    console.log(err || message);
    logfile.write('\n\npdf mail sendin status:'+err||message+"\n\n");
    res.status(200).json('mail sent');
     });
  
 });
 app.post('/sendmail1-service', urlencodedParser,function (req, res) {
   console.log(req.query.parentmail+"  "+req.query.secmail);
  var secmail=req.query.secmail;
  var server  = email.server.connect({
   user:    "samsidhschools@gmail.com",
   password:"zeeschool",
   host:    "smtp.gmail.com",
   ssl:     true
  });
  server.send({
   text:    "Report Card",
   from:    "samsidhschools@gmail.com",
   to:      req.query.parentmail,
  
  subject: "Term Report Card",
   text: "Dear Parent,"+"\n\n"+"Enclosed please find the report card of your ward.Kindly do not reply to this mail id.But you may contact the class teacher in case of any query."+"\n\n\n"+"Thanks&Regards,"+"\n"+"Class Teacher",
   attachment:
   [{
    name: 'Reportcard- '+global.studentpersonalinfo[0].student_name,
    filename: 'reportcard.pdf',
    path: './app/reportcard/'+global.studentpersonalinfo[0].student_name+'.pdf',
    type: 'application/pdf'
   }]
  },function(err, message) { 
    console.log(err || message);
    logfile.write('\n\npdf mail sendin status:'+err||message+"\n\n");
    res.status(200).json('mail sent');
     });
  
});
app.post('/fetchoveralltermwisegrade-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,term_name,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
    " lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    " from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    " and  student_id='"+req.query.studid+"' and term_name in(select term_name from md_term "+
    " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) group by term_name,subject_id,student_id";
    
console.log('................termwise.....................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      global.overalltermwisegrade=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchhealthinfo-service' ,  urlencodedParser,function (req, res)
{  
    // var qur="select * from tr_term_health where school_id='"+req.query.schoolid+"' and "+
    // "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' "+
    // " and  student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    var qur="SELECT hc.student_id, hc.height, hc.weight, hc.bmi, hc.bmi_remark, hc.vison, hc.dental, hc.hearing, hc.overall_comment"+
" FROM  tr_term_health_copy hc JOIN tr_term_health th ON ( hc.student_id = th.student_id ) WHERE hc.school_id =  '"+req.query.schoolid+"'"+
" AND th.school_id =  '"+req.query.schoolid+"' AND th.academic_year='"+req.query.academicyear+"' and th.term_id='"+req.query.termname+"' "+
     " and  th.student_id='"+req.query.studid+"' and th.grade='"+req.query.grade+"' and th.section='"+req.query.section+"'";
    console.log('......................healthinfo..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {      
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchfahealthinfo-service' ,  urlencodedParser,function (req, res)
{  
    // var qur="select * from tr_term_health where school_id='"+req.query.schoolid+"' and "+
    // "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' "+
    // " and  student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    var qur="SELECT student_id, height, weight, bmi, bmi_remark, vison, dental, hearing, overall_comment"+
" FROM  tr_term_health_copy  where student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    console.log('......................healthinfo..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchartinfo-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_art_verticals where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"'";
    
    console.log('......................talent art..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fnputcoapruval-service' ,  urlencodedParser,function (req, res)
{ 

    var qur="update single_student_markentry_table set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"'and academic_year='"+req.query.academic_year+"' and grade='"+req.query.grade+"' and subject='"+req.query.subject+"' and  section='"+req.query.section+"' and  student_id='"+req.query.studentid+"' and term_id='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject_category='"+req.query.subjectcategory+"' and flag='processing'";
    
    console.log('......................talent art..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Update','status':req.query.flag});
    }
    else
    {
       console.log(err);
      res.status(200).json({'returnval': 'invalid','status':req.query.flag});
    }
      
    
  });
  
});
app.post('/fetchphysicalinfo-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_physical_education where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"'";
    
    console.log('......................talent physical..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchgradeseperation-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_assesment_marks where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"'";
    
    console.log('...........fetchgradeseperation............');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/updateattendanceimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
if(req.query.subject=='II Language Hindi'||req.query.subject=='II Language Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_attendance "+
"where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and term_id='"+req.query.termname+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"'  and flag='active' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"')) AS count2)  AS counts";
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});


app.post('/updateattendanceimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.sectionname,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesmentid,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
        if(rows.length>0)
        {
          res.status(200).json({'returnval': 'exist'});
        }
        else
        { 
          connection.query('insert into tr_term_assesment_import_marks set ?',[data],
          function(err, rows)
          {
            if(!err)
            {
            res.status(200).json({'returnval': 'succ'});
            }
            else
            {
              console.log('No data Fetched'+err);
            }
          });
        }
      }
      else
      console.log(err);
    });
});


app.post('/updateattendanceflag-service' ,  urlencodedParser,function (req, res)
{    
 var qurcheck="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
  
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});

app.post('/fetchapprovalstatus-service' ,  urlencodedParser,function (req, res)
{ 
//var qur="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"'";
var qur="select * from mp_grade_subject s join md_grade_assesment_mapping g on(s.grade_id=g.grade_id) join md_subject sub on(sub.subject_id=s.subject_id) join md_class_section c on(g.grade_name=c.class) where s.school_id='"+req.query.schoolid+"' and "+
"g.school_id='"+req.query.schoolid+"' and c.school_id='"+req.query.schoolid+"' and c.academic_year='"+req.query.academicyear+"' and s.academic_year='"+req.query.academicyear+"' and g.academic_year='"+req.query.academicyear+"' and "+
"g.term_id=(select term_name from md_term where term='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and s.grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"') and s.subject_id not in('s14') order by g.grade_name,c.section,g.assesment_name,sub.subject_name";

var checkqur="select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'";

var qur1="select *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_assesment_import_marks where flag in('0','1') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) order by section";

var qur2="select *,(select subject_category from md_subject where subject_name=subject) as category,(select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subject_id from tr_term_fa_assesment_import_marks where flag in('0','1') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"')) order by section";

console.log('.......................subject approval fetch.....................');
console.log(checkqur);
console.log('............................................');
console.log(qur1);
console.log('............................................');
console.log(qur2);
console.log('......................overall......................');
console.log(qur);
var resp={
  flag:""
};
var arr=[];
var f1=0,f2=0;
var overall=[];
connection.query(checkqur,function(err, rows){
  if(rows.length>0){
    console.log('-----------------in----------------------');
    for(var i=0;i<rows.length;i++){
      if(rows[i].grade_id=='g1'||rows[i].grade_id=='g2'||rows[i].grade_id=='g3'||rows[i].grade_id=='g4')
        {
        resp.flag=1;
        f1=1;
        }
      else{
        resp.flag=0;
        f2=1;
      }
    }
  }
  // else{
  console.log('-----------------out----------------------');
  console.log('response flag...........'+resp.flag+" f1.... "+f1+" f2.... "+f2);
  if(f1==1&&f2==1){
    connection.query(qur,function(err, rows)
    {
    if(!err){
    overall=rows;
    console.log('----------------overall--------------'+rows.length);
    connection.query(qur1,function(err, rows)
    {
      if(!err){
      if(rows.length>0)
      {
        console.log('----------------primary--------------'+rows.length);
        arr=rows;
      }
      connection.query(qur2,function(err, rows)
      {
        if(!err){
          if(rows.length>0){
          console.log('----------------high--------------'+rows.length);
          for(var i=0;i<rows.length;i++){
            arr.push(rows[i]);
          }
          }
          console.log('------whole---------'+arr.length+"..........."+overall.length);
          res.status(200).json({'returnval': arr,'overall': overall});     
        }
      });
      }
    });  
  }
  });
  }
  else{
  if(resp.flag==1){
  connection.query(qur,function(err, rows)
    {
    if(!err){
    overall=rows;
    console.log('---------------overall--------------'+rows.length);
  connection.query(qur1,function(err, rows)
    {
    console.log(qur1);
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows,'overall': overall});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid','overall': overall});
    }
    }
    else
      console.log(err);
  });
  }
  });
  }
  if(resp.flag==0){
    console.log(qur2);
  connection.query(qur,function(err, rows)
    {
    if(!err){
    overall=rows;
    console.log('---------------overall--------------'+rows.length);
  connection.query(qur2,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows,'overall': overall});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid','overall': overall});
    }
    }
    else
      console.log(err);
  });
 }
 });
  }
  }
// }
});   

//  // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'" 
//  if(req.query.roleid=='co-ordinator'||req.query.roleid=='headmistress'){
//  var qur1="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
//  var qur2="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
//  }
//  else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'){
//  var qur1="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject!='attendance'";
//  var qur2="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject!='attendance'";
//  }
//  console.log('--------------approval status------------------');
//  console.log(qur1);
//  console.log(qur2);
// connection.query(qur1,function(err, rows){
//   if(rows.length>0){
//      res.status(200).json({'returnval': rows});
//   }
//   else{
//   connection.query(qur2,function(err, rows){
//     if(!err){
//       res.status(200).json({'returnval': rows});
//     }
//     else
//       res.status(200).json({'returnval': 'no rows'});
//   });
//   }
// });
});



app.post('/fngetinformationvalue-service' ,  urlencodedParser,function (req, res)
{    

 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'" 
  var qur1="select * from single_student_markentry_table where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and flag='processing'";
 
 console.log('--------------approval status------------------');
 console.log(qur1);

  connection.query(qur1,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else{

      res.status(200).json({'returnval': 'no rows'});
     }
});
});

















/*

app.post('/fetchapprovalstatus1-service' ,  urlencodedParser,function (req, res)
{    

 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'" 
  var qur1="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
 var qur2="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
   
 
 console.log('--------------subject status------------------');
 console.log(qur1);
 console.log(qur2);
connection.query(qur1,function(err, rows){
  if(rows.length>0){
     res.status(200).json({'returnval': rows});
  }
  else{
  connection.query(qur2,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
  }
});
});


*/



   




app.post('/fetchapprovalstatus1-service',  urlencodedParser,function (req, res)
{
//var qur="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"'";
var checkqur="select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'";
if(req.query.roleid=='subject-teacher')
var qur1="select *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subjectid from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject in(SELECT subject_name from md_subject where subject_id in(SELECT subject_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and section  in (SELECT section_id  FROM mp_teacher_grade where  id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
else
var qur1="select *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subjectid  from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' "+
" and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
" grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM "+
" mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) "+ 
" and section  in (SELECT section_id  FROM mp_teacher_grade where  id='"+req.query.loggedid+"' "+
" and role_id='"+req.query.roleid+"' and  school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"')";
if(req.query.roleid=='subject-teacher')
var qur2="select *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subjectid  from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' "+
" and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
" grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM "+
" mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) "+
" and subject in(SELECT subject_name from md_subject where subject_id in(SELECT subject_id "+
" FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) "+
" and  section  in (SELECT section_id  FROM mp_teacher_grade where  id='"+req.query.loggedid+"' "+
" and role_id='"+req.query.roleid+"' and  school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"')";
else
var qur2="select *,(select subject_category from md_subject where subject_name=subject) as category, (select language_pref from md_subject where subject_name=subject) as langpref,(select subject_id from md_subject where subject_name=subject) as subjectid  from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' "+
" and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
" grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM "+
" mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) "+ 
" and  section  in (SELECT section_id  FROM mp_teacher_grade where  id='"+req.query.loggedid+"' "+
" and role_id='"+req.query.roleid+"' and  school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"')";
console.log('.......................subject approval fetch.....................');
console.log(checkqur);
console.log('............................................');
console.log(qur1);
console.log('............................................');
console.log(qur2);
var resp={
  flag:""
};
var arr=[];
var f1=0,f2=0;
connection.query(checkqur,function(err, rows){
  if(rows.length>0){
    console.log('-----------------in----------------------');
    for(var i=0;i<rows.length;i++){
      if(rows[i].grade_id=='g1'||rows[i].grade_id=='g2'||rows[i].grade_id=='g3'||rows[i].grade_id=='g4')
        {
        resp.flag=1;
        f1=1;
        }
      else{
        resp.flag=0;
        f2=1;
      }
    }
  }
  // else{
  console.log('-----------------out----------------------');
  console.log('response flag...........'+resp.flag+" f1.... "+f1+" f2.... "+f2);
  if(f1==1&&f2==1){
    connection.query(qur1,function(err, rows)
    {
      if(!err){
      if(rows.length>0)
      {
        console.log('----------------primary--------------'+rows.length);
        arr=rows;
      }
      connection.query(qur2,function(err, rows)
      {
        if(!err){
          if(rows.length>0){
          console.log('----------------high--------------'+rows.length);
          for(var i=0;i<rows.length;i++){
            arr.push(rows[i]);
          }
          }
          console.log('------whole---------'+arr.length);
          res.status(200).json({'returnval': arr});     
        }
      });
      }
    });
  }
  else{
  if(resp.flag==1){
  connection.query(qur1,function(err, rows)
    {
      console.log(qur1);
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
  if(resp.flag==0){
    console.log(qur2);
  connection.query(qur2,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
  }
// }
});
});










app.post('/fnupdatestudentinfo-service' ,  urlencodedParser,function (req, res)
{    

 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'" 
var qur1="select student_id,student_name,subject_category,(select category_name from md_category_type where category_type=subject_category) as subject_category_name,assesment_id,grade,section,subject_id from tr_term_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and  subject_id='"+req.query.subject+"' Group by student_id ";

  var qur2="select student_id,student_name,subject_category,(select category_name from md_category_type where category_type=subject_category) as subject_category_name,assesment_id,grade,section,subject_id from tr_term_fa_assesment_marks  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and  subject_id='"+req.query.subject+"'  Group by student_id";
  console.log('--------------detail studentinfo status------------------');
  console.log(qur1);
  console.log(qur2);
 connection.query(qur1,function(err, rows){
  if(rows.length>0){
     res.status(200).json({'returnval': rows});
  }
  else{
  connection.query(qur2,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
  }
});
});


app.post('/updatestudentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="update md_student set student_name='"+req.query.name+"' where school_id='"+req.query.schoolid+"' and "+
 " id='"+req.query.enrno+"' and flag='active' and academic_year='"+req.query.academicyear+"'";
 var qur1="update parent set mother_name='"+req.query.mothername+"',address1='"+req.query.address+"',parent_name='"+req.query.pname+"',alternate_mail='"+req.query.alternatemail+"',email='"+req.query.pmail+"' where school_id='"+req.query.schoolid+"' and "+
 " student_id='"+req.query.enrno+"' and academic_year='"+req.query.academicyear+"'"; 
 var qur2=" select * from parent where school_id='"+req.query.schoolid+"' and "+
 " student_id='"+req.query.enrno+"' and academic_year='"+req.query.academicyear+"'";
 var qur3="insert into parent values('"+req.query.schoolid+"','"+req.query.enrno+"','"+req.query.pname+"','"+req.query.pmail+"','','"+req.query.address+"','','','',0,'','"+req.query.mothername+"','"+req.query.academicyear+"')";  
 console.log('--------------updateinfo status------------------');
 console.log(qur);
 console.log(qur1);
 console.log(qur2);
 console.log(qur3);


  connection.query(qur,function(err, rows){
    if(!err){
      connection.query(qur2,function(err, rows){
        if(rows.length==0){
          console.log('insert');
          connection.query(qur3,function(err, rows){
            if(!err)
            res.status(200).json({'returnval': 'Parent detail not found added newly!!'});
            else
              console.log(err);
          });
        }
        else{
        connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
});



app.post('/studentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="select * from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and id='"+req.query.enrno+"' and flag='active'";
  
 console.log('--------------studinf status------------------');
 console.log(qur);

  connection.query(qur,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});

app.post('/studentparentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="select * from parent where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.enrno+"'";
  
 console.log('--------------studparent status------------------');
 console.log(qur);

  connection.query(qur,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});


app.post('/insertoverallfagrade-service' ,  urlencodedParser,function (req, res)
{    
 var response={
            school_id:req.query.schoolid,
            academic_year:req.query.academicyear,
            term_name:req.query.termname,
            grade:req.query.grade,
            section:req.query.section,
            subject_id:req.query.subject,
            category:req.query.category,
            student_id:req.query.studentid,
            student_name:req.query.studentname,
            total:req.query.total,
            cat_grade:req.query.catgrade
 }
  
 console.log('--------------insery status------------------');
 // console.log(qur);

  connection.query("INSERT INTO tr_term_overallfa_assesment_marks SET ?",[response],function(err, rows){
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});
  

app.post('/rolecreation-service' ,  urlencodedParser,function (req, res)
{  
    var response={"id":req.query.roleid,"role_name":req.query.rname}; 

    //console.log(JSON.stringify(response));

    connection.query("SELECT * FROM md_role WHERE  id='"+req.query.roleid+"' or role_name='"+req.query.rname+"'",
      function(err, rows)
    {
    if(rows.length==0)
    {
    connection.query("INSERT INTO md_role SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'failed'});
    }
  });
});



app.post('/fetchrole-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_role";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval': empty}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/thirdlangrefret-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT subject_id as subid,( select subject_name from md_subject where subject_id=subid)as subjectid FROM tr_student_to_subject where school_id='"+req.query.school_id+"' and flag='active' and academic_year='"+req.query.academic_year+"' and grade='"+req.query.gradeid+"' and class_id='"+req.query.classid+"' and student_id='"+req.query.id+"' and flag='active'";
  console.log("------------------askcnsa--------------");
  console.log(qur);
  console.log("-----------------zcknkcs---------------");
  
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval':'empty'}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/deleterole-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_role where  id='"+req.query.roleid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});


app.post('/undotudentverifyvalues1-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  tr_student_varified_table where school_id='"+req.query.schoolid+"' and "+
    "grade_name='"+req.query.grade+"' and section_name='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_id='"+req.query.termname+"' and student_id='"+req.query.studentid+"'";
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});










app.post('/updaterole-service' ,  urlencodedParser,function (req, res)
{  
   var rval=(req.query.roleid);
   var val=(req.query.rname);
  var qur="UPDATE  md_role SET role_name='"+val+"', id='"+rval+"' where  id='"+req.query.oldid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
    //  console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});


app.post('/subjectcreation-service' ,  urlencodedParser,function (req, res)

{  
    var response={"subject_id":req.query.subjectid,
    "subject_name":req.query.subjectname,"subject_category":req.query.category,"language_pref":req.query.preflang,"type":req.query.type}; 
  var qqq="SELECT * FROM md_subject WHERE subject_id='"+req.query.subjectid+"' or subject_name='"+req.query.subjectname+"'";
     //console.log(qqq);
     //console.log(response);
 
    connection.query(qqq, function(err, rows)
    {
    if(rows.length==0)
    {
        connection.query("INSERT INTO md_subject SET ?",[response],
          function(err, rows)
          {
            if(!err)
            {
              var tempseq=parseInt((req.query.subjectid).substring(1))+1;
              connection.query("UPDATE sequence SET subject_seq='"+tempseq+"'", function (err,result){
              if(result.affectedRows>0)
                  res.status(200).json({'returnval': 'Inserted!'});
              });
            }
              else
              {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
              }
            });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
  });
});

app.post('/fetchmastercategoryname-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_category_type";
    //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': ''}); 
  });
});
app.post('/fngetpasssectinvalue-service',  urlencodedParser,function (req,res)
  {  
    /* var obj={"school_id":"","schooltype":"","acadamicyear":""};
*/  var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"' and acadamic_year='"+req.query.acadamicyear+"'";
    //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': ''}); 
  });
});


app.post('/fetchsubjectseq-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});  
app.post('/fnbooksubconceptedit-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM md_sub_concept where concept_id='"+req.query.conceptid+"' and capter_id='"+req.query.capterid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});  

app.post('/fetchmastersubject-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT subject_id,subject_name ,(select category_name from md_category_type where category_type=subject_category) as category,subject_category from md_subject";
  //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
        //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});


app.post('/deletesubjectname-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_subject where subject_id='"+req.query.subjectid+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});

app.post('/updatesubjectname-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="UPDATE  md_subject SET subject_name='"+req.query.subjectname+"' where subject_id='"+req.query.subjectid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});
// app.post('/fetchconsolidatedtermwise-service' ,  urlencodedParser,function (req, res)
// {  
//     var qur="select student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
//     "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
//     "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id order by subject_id";
    
//     console.log('......................overalltermwise..............................');
//     console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       //console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });
app.post('/fetchconsolidatedtermwise-service',  urlencodedParser,function (req, res)
{
   var qur="select term_name, (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname, assesment_id,student_id,subject_id,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,term_name,assesment_id,CHAR_LENGTH(subject_id)";

   var categorycnt="SELECT subject_id,subject_name FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  subject_id in(select subject_id from mp_grade_subject where school_id='"+req.query.schoolid+"' and  grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academicyear+"' ) and grade_name='"+req.query.grade+"' group by assesment_type,CHAR_LENGTH(subject_name)";

    var map="SELECT distinct(assesment_type) FROM subject_mapping WHERE school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academicyear+"' and "+
   "grade_name='"+req.query.grade+"' order by assesment_type ";


console.log('--------SDFSFDSFSF--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
console.log(map);

 var arr1=[];
 var arr2=[];

 connection.query(qur, function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
 connection.query(categorycnt, function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
  connection.query(map,function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'arr1':arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


/*app.post('/consolidateddatanalysisreport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
=======
app.post('/consolidateddatanalysisreport-service',  urlencodedParser,function (req, res)
{
  var qur="select  (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname,student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
>>>>>>> 432419a070d950ede8d716d42f3f5ca796b78131
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,CHAR_LENGTH(subject_id)";

var categorycnt="SELECT distinct(subject_id),subject_name FROM subject_mapping  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and  subject_id in(select subject_id from mp_grade_subject where school_id='"+req.query.schoolid+"' and  grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academicyear+"' ) group by CHAR_LENGTH(subject_name)";

console.log('--------suibject report--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
 var arr1=[];

 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,   
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':rows});
    }
    });
    }   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
*/
app.post('/consolidateddatanalysisreport-service',  urlencodedParser,function (req, res)
{
  var qur="select  (select r.student_name from md_student r where r.id=student_id and r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academicyear+"')as studentname,student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by student_id,CHAR_LENGTH(subject_id)";

var categorycnt="SELECT distinct(subject_id),subject_name FROM subject_mapping  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and  subject_id in(select subject_id from mp_grade_subject where school_id='"+req.query.schoolid+"' and  grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academicyear+"' ) group by CHAR_LENGTH(subject_name)";

console.log('--------suibject report--------------');
console.log(qur);
console.log('-----------------------');
console.log(categorycnt);
console.log('----------------------------');
 var arr1=[];

 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
   
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':rows});
    }
    });
    }
   
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



// app.post('/consolidateddatanalysisreport-service' ,  urlencodedParser,function (req, res)
// {  
//     var qur="select student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
//     "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
//     "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
//     "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
//     "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id order by subject_id";
    
//     console.log('......................consolidated analysis report..............................');
//     console.log(qur);
//     connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {
//     if(rows.length>0)
//     {
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       //console.log(err);
//       res.status(200).json({'returnval': 'invalid'});
//     }
//     }
//     else
//       console.log(err);
// });
// });

app.post('/deletemarks-service' ,  urlencodedParser,function (req, res)
{  
var qur="DELETE FROM tr_term_assesment_marks WHERE  school_id LIKE  '"+req.query.schoolid+"' "+
"AND academic_year LIKE  '"+req.query.academicyear+"' AND assesment_id LIKE  '"+req.query.assesmentid+"' "+
"AND  term_name LIKE  '"+req.query.termname+"' AND  student_id LIKE  '"+req.query.studentid+"' AND  grade LIKE  '"+req.query.grade+"' "+
"AND  section LIKE  '"+req.query.section+"' AND  subject_id LIKE  '"+req.query.subject+"'";
    
    console.log('......................delete mark..............................');
    //console.log(qur);
    connection.query(qur,
    function(err, result)
    {
    if(!err)
    {
    if(result.affectedRows>0)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    }
    else
      console.log(err);
});
});


app.post('/revertsubmittedmark-service' ,  urlencodedParser,function (req, res)
{  
  if(req.query.grade=="Grade-1"||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4")
  var qur="DELETE FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and flag='0'";
  else
  var qur="DELETE FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and flag='0'";
   console.log('-----------------------');
   console.log(qur);
   connection.query(qur,function(err, result)
    {
    if(result.affectedRows>0){
      res.status(200).json({'returnval': 'Reverted!'});
    }
    else
      res.status(200).json({'returnval': 'Unable to revert!'});
    });
});


app.post('/schooltypecreation-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_type_id":req.query.schooltypeid,"school_type_name":req.query.stypename};
   //console.log(JSON.stringify(collection));
   connection.query("SELECT * FROM md_school_type WHERE school_type_name='"+req.query.stypename+"' or school_type_id='"+req.query.schooltypeid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_type SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'failed'});
    }
    });
  });


app.post('/updateschooltypename-service' ,  urlencodedParser,function (req, res)
{  
   var sval=(req.query.schooltypeid);
   var val=(req.query.stypename);
   var qur="UPDATE  md_school_type SET school_type_name='"+val+"', school_type_id='"+sval+"' WHERE school_type_id='"+req.query.oldscltypeid+"' "; 
    //console.log(qur);    
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
  });


app.post('/fetchschool-service' ,  urlencodedParser,function (req, res)
{  
  var qur="SELECT * FROM md_school where id not in('School')";
   console.log('-----------------------');
   //console.log(qur);
   connection.query(qur,function(err, rows)
    {
    if(rows.length>0){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows!'});
    });
});



app.post('/fetchsclidseq-service',  urlencodedParser,function (req,res)
   {  
     // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
    var qur="SELECT * FROM sequence";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

{  
     var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
    //console.log(e);
  var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and flag='active'";
    //console.log(e);
  var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and flage='active'";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/Fnsaveschoolinfo-service' ,  urlencodedParser,function (req, res)
{  
   
 var qur="UPDATE  md_school SET short_name='"+req.query.shortname+"',name='"+req.query.school+"',telno='"+req.query.telnum+"',mobile_no='"+req.query.MobileNumber+"',email_id='"+req.query.Emailid+"',website='"+req.query.Website+"',affiliation_no='"+req.query.affiliation+"',address='"+req.query.addr+"',address1='"+req.query.addr1+"',Board='"+req.query.Boardselection+"',address2='"+req.query.addr2+"',address3='"+req.query.addr3+"' where  id='"+req.query.schoolid1+"'";
 //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});

app.post('/FnSetschoolInfo-service' , urlencodedParser,function (req, res)
{  
    var response={ 
      id:req.query.schoolid1,     
      name:req.query.school,
      mobile_no:req.query.MobileNumber,
      telno:req.query.Telephone,
      email_id:req.query.Emailid,
      address:req.query.address,
      address1:req.query.address1,
      address2:req.query.address2,
      address3:req.query.address3,
      affiliation_no:req.query.affiliation,
      website:req.query.Website,
      Board:req.query.Board, 
      short_name:req.query.shortname,
      
      
    };   
   
     //  console.log(JSON.stringify(response));
    var qur="SELECT * FROM  md_school WHERE id='"+req.query.schoolid1+"'";
   // var qurr="SELECT subject_type FROM md_language_type_master where subject_id='"+req.query.seclang11+"'";
    var qur1="update md_school set short_name='"+req.query.shortname+"',name='"+req.query.school+"',address='"+req.query.address+"',address1='"+req.query.address1+"',address2='"+req.query.address2+"',address3='"+req.query.address3+"',telno='"+req.query.Telephone+"',mobile_no='"+req.query.MobileNumber+"',affiliation_no='"+req.query.affiliation+"',email_id='"+req.query.Emailid+"',Board='"+req.query.Board+"',website='"+req.query.website+"'where id='"+req.query.schoolid1+"'";

    connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
      //console.log(qur);
     connection.query("INSERT INTO md_school SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
     
    var tempseq1=parseInt((req.query.schoolid1).substring(4))+1;
      connection.query("UPDATE sequence SET school_seq='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted!'});
      });

    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       //console.log(qur1);
        connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
     
 });
});
app.post('/Fndeleteinfo-service' ,  urlencodedParser,function (req, res)
{  
  var qur="DELETE FROM md_school WHERE id='"+req.query.schoolid1+"';DELETE FROM md_employee_creation WHERE school_id='"+req.query.schoolid1+"'";
  console.log(qur);  
 var qur1="DELETE FROM  md_school where  id='"+req.query.schoolid1+"'";
console.log(qur);
  connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
    //  console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
});
app.post('/fnschoolcreation-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="select * from md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else if(rows.length==0 || rows.length==null)
      {
        res.status(200).json({'returnval': "empty"});
      }
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});



 /*app.post('/empgetschooltype11-service',  urlencodedParser,function (req,res)


    // app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

    {  
         var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
        console.log(e);
      var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"'";
      connection.query(qur,
        function(err, rows)
        {
        if(!err)
        { 
          console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });
*/
app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
{  
  var e={id:req.query.school_id};
  console.log(e);
  var qur="select * from md_school where id='"+req.query.school_id+"'";
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });
});
app.post('/fnsetgrademapping-service',  urlencodedParser,function (req,res)
{  
   //  var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolgradeset-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
    // console.log(e);
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/counttypevalue-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
    // console.log(e);
  var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and  acadamic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fetchcategoryseq-service',  urlencodedParser,function (req,res)
   {  
     // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
    var qur="SELECT * FROM sequence";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchmastercategory-service',  urlencodedParser,function (req,res)
  {  
  var qur="SELECT * FROM md_category_type";
  //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
       else if(rows.length==0|| row.length==null)
        { 
          //console.log(JSON.stringify(rows));  
          res.status(200).json({'returnval': 'empty'});
        }
    }
        
    else
      res.status(200).json({'returnval': 'invalid'});
    });

});

app.post('/categorynewcreation-service' , urlencodedParser,function (req, res)
 {  
  var collection = {"category_id":req.query.categoryid,
  "category_name":req.query.cname,"category_type":req.query.categorytype};

   //console.log(JSON.stringify(collection));

   connection.query("SELECT * FROM md_category_type WHERE  category_name='"+req.query.categoryname+"' or category_id='"+req.query.categoryid+"' ",function(err, rows)
    {
    if(rows.length==0)
    {
      //console.log(rows);
      connection.query("INSERT INTO md_category_type SET ? ",[collection],
      function(err, rows)
      {

    if(!err)
    {
      var tempseq=parseInt((req.query.categorytype).substring(8))+1;
      //console.log(tempseq);
      connection.query("UPDATE sequence SET category_seq='"+tempseq+"'",
      function (err,result)
      {
        if(result.affectedRows>0)
              res.status(200).json({'returnval': 'Inserted!'});
      });
    }
        else 
        {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
        }
     });
     }
     else
    {
      res.status(200).json({'returnval': 'failed'});
    }
    });
  });
app.post('/deletecategoryname-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_category_type where category_id='"+req.query.categoryid+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/fnschooltypegradmapz1-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur=" DELETE FROM md_school_grade_mapping WHERE school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'and grade_id='"+req.query.gradeid+"'and grade_name='"+req.query.gradename+"'and academic_year='"+req.query.academic_year+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
 app.post('/masterfetchgrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
        //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
      }
      else
      {
        res.status(200).json({'returnval': empty});
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});




app.post('/updatecategoryname-service' ,  urlencodedParser,function (req, res)

{
  var cval=(req.query.categoryid);
   var val=(req.query.cname);
  var qur="UPDATE  md_category_type SET category_name='"+val+"', category_id='"+cval+"'  where category_id='"+req.query.oldcatid+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    });
app.post('/fetchgradeseq-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/gradecreation-service' ,  urlencodedParser,function (req, res)
{  
    var response={"grade_id":req.query.gradeid,"grade_name":req.query.gradename}; 

    //console.log(JSON.stringify(response));

    connection.query("SELECT * FROM md_grade WHERE grade_id='"+req.query.gradeid+"' or grade_name='"+req.query.gradename+"'",function(err, rows)
    {
    if(rows.length==0)
    {
            connection.query("INSERT INTO md_grade SET ?",[response],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq={"grade_seq":parseInt((req.query.gradeid).substring(1))+1};
                      connection.query('UPDATE sequence SET ?',[tempseq],
                        function (err,result){
                        if(result.affectedRows>0)
                      res.status(200).json({'returnval': 'Inserted!'});
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
    }
    else
    {

      res.status(200).json({'returnval': 'failed'});
    }
  });
});

app.post('/deletegrade-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_grade where  grade_id='"+req.query.gradeid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});

app.post('/updategrade-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="UPDATE  md_grade SET grade_name='"+req.query.gradename+"' where  grade_id='"+req.query.gradeid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {   
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});
app.post('/fnempgenerateid-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM school_sequence where school_id='"+req.query.schllid+"'";
  connection.query(qur,  
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/Generatesectionid-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM school_sequence where school_id='"+req.query.scholid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/tranfergradeinfo-service', urlencodedParser,function (req,res)
{      
     
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschooltypez-service',  urlencodedParser,function (req,res)
{  
 
   var qur="SELECT * FROM  md_school_grade_mapping_dummy where school_type='"+req.query.schooltypeid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectrolename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_role where id!='management' and id!='superadmin' and id!='schooladmin'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolemployeepersonal-service',  urlencodedParser,function (req,res)
{  

var qur="SELECT * FROM md_employee_creation where school_id='"+req.query.school_id+"'  and academic_year='"+req.query.academic_year+"' and flage='active'";

console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      
      res.status(200).json({'returnval': rows}); 
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});

app.post('/emppersonaldetails-service' ,  urlencodedParser,function (req, res)

{  
    var response={"emp_id":req.query.empid,
    "emp_name":req.query.name,"school_id":req.query.school_id,"emp_phone":req.query.Telephone,"emp_password":req.query.password,"emp_mobile":req.query.MobileNumber,"emp_mail":req.query.mailid,"flage":req.query.flage,academic_year:req.query.academic_year}; 

      console.log('-----------personal detail creation--------');
     console.log(JSON.stringify(response));

connection.query("SELECT * FROM md_employee_creation WHERE emp_id='"+req.query.empid+"'and school_id='"+req.query.school_id+"' and emp_phone='"+req.query.Telephone+"'and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
            connection.query("INSERT INTO md_employee_creation SET ?",[response],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq=parseInt((req.query.empid).substring(6))+1;
              console.log(tempseq);
                      connection.query("UPDATE school_sequence SET emp_sequence='"+tempseq+"' where school_id='"+req.query.school_id+"'", function (err,result){
                        if(result.affectedRows>0)
                        {
                          console.log(rows);
                          res.status(200).json({'returnval': 'Inserted!'});
                        }
                      
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
  });
});
app.post('/empschooltypemapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"emp_id":req.query.empid,"school_type":req.query.schooltypeid,"emp_name":req.query.name,"flage":req.query.flage,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));

connection.query("SELECT * FROM employee_to_school_type_category_mapping WHERE emp_id='"+req.query.empid+"' and school_type='"+req.query.schooltypeid+"'and school_id='"+req.query.school_id+"'and emp_name='"+req.query.name+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO employee_to_school_type_category_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });  
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/sectioncreationmapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"grade_id":req.query.grade_id,"section_id":req.query.sectionid,"class_id":req.query.classid, "academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
     // var obj={"school_id":"","grade_id":"","sectionid":"","classid":""};
    console.log('-----------emp creation role creation-------');  
    var qur="SELECT * FROM mp_grade_section WHERE school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"'and section_id='"+req.query.sectionid+"' and  academic_year='"+req.query.academic_year+"'";
    connection.query(qur,function(err, rows)
    {
    if(rows.length==0)
    {
  
     connection.query("INSERT INTO mp_grade_section SET ?",[collection],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq=parseInt((req.query.classid).substring(6))+1;
              console.log(tempseq);
                      connection.query("UPDATE school_sequence SET sec_sequence='"+tempseq+"' where school_id='"+req.query.school_id+"'", function (err,result){
                        if(result.affectedRows>0)
                      res.status(200).json({'returnval': 'Inserted!'});
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
         }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/sectioncreationmapping1-service' , urlencodedParser,function (req, res)
{  
     //    var obj={"school_id":"","sectionname":"","sectionid":""};
     
 var collection = {"school_id":req.query.school_id,"section_id":req.query.sectionid,"section_name":req.query.sectionname,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_section WHERE section_id='"+req.query.sectionid+"' and section_name='"+req.query.sectionname+"'and school_id='"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_section SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
      //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/sectioncreationmapping2-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"id":req.query.classid,"section":req.query.sectionid,"class":req.query.grade_name,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
   //      var obj={"school_id":"","grade_name":"","sectionid":"","classid":""};
   
connection.query("SELECT * FROM md_class_section WHERE school_id='"+req.query.school_id+"' and class='"+req.query.grade_name+"'and section='"+req.query.sectionid+"'and id='"+req.query.classid+"'and  academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_class_section SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });


app.post('/fnschooltypegradmapz-service' , urlencodedParser,function (req, res)
{  
     var obj={"school_id":"","schooltype":"","gradename":""};
      
  var collection = {"school_id":req.query.school_id,"school_type":req.query.schooltype,"grade_id":req.query.gradeid,"grade_name":req.query.gradename,"academic_year":req.query.academic_year};
   console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_school_grade_mapping WHERE school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'and grade_id='"+req.query.gradeid+"'and grade_name='"+req.query.gradename+"'and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_grade_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
  app.post('/emprolemapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"id":req.query.empid,"role_id":req.query.roleid,"password":req.query.password,"name":req.query.name,"flage":req.query.flage,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
    var qur="SELECT * FROM md_employee WHERE school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'  and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academic_year+"'";
    console.log('--------emp role creation---------');
    console.log(qur);
    console.log(JSON.stringify(collection));
    console.log('----------------------------------');
    connection.query(qur,function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log('--------------error--------------');
        console.log(err);
        console.log('----------------------------');
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
  app.post('/selectschooltype11-service',urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
   //console.log(qur);
   var m={"school_id":req.query.school_id};
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectrolename11-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_role where id!='management' and id!='superadmin' and id!='schooladmin'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschooltypegradmapzdb-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school_grade_mapping where  school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  //console.log(JSON.stringify(qur));   
      
  connection.query(qur,

    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/getempschoolrole-service' ,  urlencodedParser,function (req, res)
{  
    // var obj={"school_id":"","emp_id":"","emp_name":"","emp_schol_type":""};
               
    var qur="DELETE FROM  md_employee where school_id='"+req.query.school_id+"' and id='"+req.query.emp_id+"' and  name='"+req.query.emp_name+"' and role_id='"+req.query.school_role_id+"' and password='"+req.query.emp_psw+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/getempschooltype-service' ,  urlencodedParser,function (req, res)
{  
     //var obj={"school_id":"","emp_id":"","emp_name":"","emp_schol_type":""};
               
    var qur="DELETE FROM  employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"' and school_type='"+req.query.emp_schol_type+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else  
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fnschooltypesaveinfo-service' , urlencodedParser,function (req, res)
{
 var collection = {"school_id":req.query.school_id,"emp_id":req.query.emp_id,"emp_name":req.query.emp_name,"school_type":req.query.emp_schol_type,"flage":req.query.flage,"academic_year":req.query.academic_year,};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM employee_to_school_type_category_mapping WHERE school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"'  and school_type='"+req.query.emp_schol_type+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO employee_to_school_type_category_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/fnrolesaveinfo-service' , urlencodedParser,function (req, res)
{  
       
  var collection = {"school_id":req.query.school_id,"id":req.query.emp_id,"name":req.query.emp_name,"role_id":req.query.emp_role_id,"password":req.query.password,"flage":req.query.flage,"academic_year":req.query.academic_year};
   console.log(JSON.stringify(collection));
 connection.query("SELECT * FROM md_employee WHERE school_id='"+req.query.school_id+"' and id='"+req.query.emp_id+"' and name='"+req.query.emp_name+"' and  role_id='"+req.query.emp_role_id+"' and password='"+req.query.password+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee SET ?",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/Fnpersonalinfo-service' ,  urlencodedParser,function (req, res)
 {  
  var qur="UPDATE  md_employee_creation SET   emp_name='"+req.query.employeename+"' , emp_phone='"+req.query.employeephone+"' , emp_password='"+req.query.employeepassword+"' , emp_mobile='"+req.query.employeemobile+"' where emp_id='"+req.query.employeeid+"' and school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"'"; 
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'updated!'});
    }
    else
    {
     res.status(200).json({'returnval': 'Not updated!'});
    }
    });
    
});
app.post('/Fnempdeleteinfoz-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee_creation set flage='"+req.query.flage+"' where emp_id='"+req.query.employeeid+"' and emp_name='"+req.query.employeename+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'";
 
  console.log("------empcreation--------------");
   console.log(qur);
     connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    
});app.post('/Fnempdeleteinforole-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee  set  flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"'  and name='"+req.query.employeename+"'and academic_year='"+req.query.academic_year+"'";
  console.log("------emprole--------------");
    console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    
});
app.post('/fnschoolsubjetflage-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee_subject  set  flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and emp_id='"+req.query.employeeid+"'  and emp_name='"+req.query.employeename+"'and academic_year='"+req.query.academic_year+"'";
  console.log("------empsubject--------------");
    console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
     });
    });
app.post('/empsubjectdective-service' ,  urlencodedParser,function (req, res)
  {  
  var qur="update  mp_teacher_grade set flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"'and academic_year='"+req.query.academic_year+"'";
  console.log("------empmapping section--------------");
    console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }

    });
    });
app.post('/curiculamdelete-service' ,  urlencodedParser,function (req, res)
  {  
  var qur="delete  from  md_curriculum_planning_approval where school_id='"+req.query.school_id+"'  and academic_year='"+req.query.academic_year+"'and id='"+req.query.employeeid+"'";

  console.log("-----------------curicullam-------------");
    console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }

    });
    });

app.post('/Fnempdeleteinfotype-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  employee_to_school_type_category_mapping set flage='"+req.query.flage+"' where emp_id='"+req.query.employeeid+"' and emp_name='"+req.query.employeename+"' and school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    });
app.post('/fnschoolemployeeschooltype-service',  urlencodedParser,function (req,res)
   {  
   var qur="SELECT * FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"' and emp_id='"+req.query.employeeid+"'  and academic_year='"+req.query.academic_year+"' and flage='active'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolemployeerole-service',  urlencodedParser,function (req,res)
 {  
   var qur="SELECT * FROM md_employee where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
    {  
     // var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from md_school where id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          //console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });
app.post('/sectioncreategrade-service' ,urlencodedParser, function (req, res)
    {    
      //var e={id:req.query.school_id};
    //  console.log(e);
      var qur="select * from md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.sectionschooltypeid+"' and academic_year='"+req.query.academic_year+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
       //   console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });

app.post('/sectioncreategrade1-service' ,urlencodedParser, function (req, res)
    {  
     var qur="SELECT s.grade_id,s.grade_name,UPPER(p.section_id)as section_id, p.class_id FROM md_school_grade_mapping s join mp_grade_section p  on s.grade_id=p.grade_id  where p.school_id='"+req.query.school_id+"' and s.school_id='"+req.query.school_id+"' and p.academic_year='"+req.query.academic_year+"' and s.academic_year='"+req.query.academic_year+"' and s.school_type='"+req.query.sectionschooltypeid+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });


app.post('/termrecovery-service',urlencodedParser,function (req,res)
{ 
//  var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":""};
        
  var qur="SELECT * FROM md_workingdays where school_id='"+req.query.workingschoolid+"' and academic_year='"+req.query.acadamicyear+"'and term_name='"+req.query.termids+"' and type='"+req.query.termgrade+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});

app.post('/subjectapprovalaudit-service' , urlencodedParser,function (req, res)
{  
    var response={

      school_id:req.query.schoolid,
      academic_year:req.query.academicyear,
      assesment_level2:req.query.assesment,
      grade:req.query.gradename,
      section:req.query.section,
      subject_id:req.query.subject,
      term_name:req.query.termname,

      };
      console.log(response);
     var qur="SELECT * FROM tr_term_auditimport WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and grade='"+req.query.gradename+"'";

     var qur1="update tr_term_auditimport set assesment_level2='"+req.query.assesment+"' WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and grade='"+req.query.gradename+"'";

     console.log("-------------audit-service-value--------");
    console.log(qur);
    console.log("---------------------------------");
    console.log(qur1)
    console.log("---------------------------------")
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_term_auditimport SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});










app.post('/terminsert-service' , urlencodedParser,function (req, res)
{  
    var response={
      school_id:req.query.school_id,
      academic_year:req.query.acadamicyears,
      school_type:req.query.schootypids,
      type:req.query.gradename,
      no_of_days:req.query.termvalue,
      term_name:req.query.termid,

      };
      console.log(response);
  var qur="SELECT * FROM md_workingdays WHERE school_id='"+req.query.school_id+"' and academic_year='"+req.query.acadamicyears+"' and school_type='"+req.query.schootypids+"' and type='"+req.query.gradename+"' and term_name='"+req.query.termid+"'";

    var qur1="update md_workingdays set no_of_days='"+req.query.termvalue+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.acadamicyears+"' and school_type='"+req.query.schootypids+"' and term_name='"+req.query.termid+"'and type='"+req.query.gradename+"'";

    console.log(qur);
    console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO md_workingdays SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});

app.post('/fnsectiostudentpassvalue-service' , urlencodedParser,function (req, res)
{  
var response={
            school_id:req.query.school_id,
            acadamic_year:req.query.acadamicyears,
            grade_id:req.query.gradeid,
            grade_name:req.query.gradename,
            no_of_section:req.query.section,
            no_of_student:req.query.student,
            school_type:req.query.schootypids,
            capacity:req.query.capacity,
         }
     //var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":"","noofdays":""};
        

    console.log(JSON.stringify(response));
    var qur="SELECT * FROM allow_student_section WHERE school_id='"+req.query.school_id+"' and acadamic_year='"+req.query.acadamicyears+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schootypids+"'";

    var qur1="update allow_student_section set no_of_section='"+req.query.section+"',no_of_student='"+req.query.student+"',capacity='"+req.query.capacity+"'where school_id='"+req.query.school_id+"' and acadamic_year='"+req.query.acadamicyears+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schootypids+"'";

   /* console.log(qur);
    console.log(qur1)*/
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO allow_student_section SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});



app.post('/checksctionvalue-service', urlencodedParser,function (req,res)
{  
     
  var qur="SELECT COUNT(DISTINCT class_id) AS section_id FROM mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/countsectionvalue-service', urlencodedParser,function (req,res)
 {  
var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"'and acadamic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/studenttranferinfo-service',  urlencodedParser,function (req,res)
{ 
  var qur="SELECT school_id,class_id,school_type,id,student_name,school_type,(select class from md_class_section where id= class_id) as class,(select section from md_class_section where id= class_id) as section  FROM md_student where id='"+req.query.studentname+"'and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/tranfersection-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_class_section where class='"+req.query.setgradeid+"' and school_id='"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"'";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/insertgradeinfo-service',urlencodedParser,function (req, res)
{  
 var qurr="select school_type from md_school_grade_mapping where grade_name='"+req.query.setgradeid+"' and academic_year='"+req.query.academic_year+"'";  
 //console.log(qurr);

 var response={class_id:req.query.tranfersection,
  school_type:req.query.setgradeid};
//console.log(response);

var qur1="UPDATE md_student SET ? WHERE id='"+req.query.studentname+"' and school_id='"+req.query.school_id+"' and "+" academic_year='"+req.query.academic_year+"' and flag='active'";
//console.log(qur1);
  connection.query(qurr,
    function(err, rows){
    response.school_type=rows[0].school_type;
   
   connection.query(qur1,[response],
    function(err, rows)
    {
    if(!err)
    {  console.log(rows);
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
     // console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
     });
    });
  });
app.post('/deletegradeinfo-service' ,urlencodedParser,function (req, res)
{  
var qur="DELETE FROM  md_student where school_id='"+req.query.school_id+"' and school_type='"+req.query.setgradeid+"' and class_id='"+req.query.tranfersection+"' and id='"+req.query.studentname+"'and academic_year='"+req.query.academic_year+"' and flag='active'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fndelsectiongrade1-service' ,urlencodedParser,function (req, res)
{  
     var obj={"school_id":"","sectionname":"","sectionid":""};
      
var qur="DELETE FROM  md_section where school_id='"+req.query.school_id+"' and section_name='"+req.query.sectionname+"' and section_id='"+req.query.sectionid+"'";
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });


app.post('/fndelsectiongrade11-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_student where grade_id='"+req.query.grade_id+"' and school_id='"+req.query.school_id+"'and class_id='"+req.query.classid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval':'empty'}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/fndelsectiongrade-service' ,urlencodedParser,function (req, res)
{  
var qur="DELETE FROM  mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and class_id='"+req.query.classid+"' and section_id='"+req.query.sectionid+"' and academic_year='"+req.query.academic_year+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fndelsectiongrade2-service' ,urlencodedParser,function (req, res)
{  
 //       var obj={"school_id":"","grade_name":"","sectionid":"","classid":""};
   
var qur="DELETE FROM  md_class_section where school_id='"+req.query.school_id+"' and class='"+req.query.grade_name+"' and section='"+req.query.sectionid+"' and id='"+req.query.classid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });

app.post('/getstudentname-service',  urlencodedParser,function (req, res)
{
 /*var qur="SELECT id,student_name,(SELECT class FROM scorecarddb.md_class_section where id=class_id and class='"+req.query.grade_id+"') as grade FROM scorecarddb.md_student where school_id='"+req.query.school_id+"'";
*/
  var qur1="SELECT id,student_name,(SELECT class FROM md_class_section where id= class_id)as grade FROM md_student where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and class_id in (SELECT id FROM md_class_section where id=class_id and school_id='"+req.query.school_id+"'and class='"+req.query.grade_id+"') and academic_year='"+req.query.academic_year+"' and flag='active'";

  connection.query(qur1,
        function(err, rows)
        {
    if(!err)
    {
    if(rows.length>0)
    {
//console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
  }
  else{
     console.log(err);
  }
});
});
app.post('/getschoolTypename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/getschoolTypename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
  
app.post('/selectsectiongrade-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnsetpasssectinvalue-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'  and academic_year='"+req.query.acadamicyear+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {   
    if(!err)      
     { 
       res.status(200).json({'returnval': rows});
      }
    else
      res.status(200).json({'returnval': ''});  
  });
});




app.post('/fnsetpasssectinvalue2-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'  and academic_year='"+req.query.acadamicyear+"'";

  var qur1="SELECT * FROM md_workingdays where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"' and academic_year='"+req.query.acadamicyear+"'";
   console.log("--------------working 9to10-------------");
   console.log(qur);
   console.log(qur1);  
   var dbarr=[]
   connection.query(qur1,function(err, rows)
    {   
    if(!err) 
      dbarr=rows;
     connection.query(qur,function(err, rows)
     {   
    if(!err)      
     { 
       res.status(200).json({'returnval': rows,'dbarr':dbarr});
      }
    else{
      res.status(200).json({'returnval': ''});  
      }
    });
   });
});


app.post('/fnsetpasssectinvalue3-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'  and academic_year='"+req.query.acadamicyear+"'";

  var qur1="SELECT * FROM md_workingdays where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"' and academic_year='"+req.query.acadamicyear+"'";
  
  var qur2="SELECT  DISTINCT(grade_id),grade_name,term_id FROM md_grade_assesment_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.acadamicyear+"'";
   console.log("--------------working 9to10-------------");
   console.log(qur);
   console.log(qur1);  
   console.log(qur2);  
   var dbarr=[];
   var dbarr1=[];
   connection.query(qur1,function(err, rows)
    {   
    if(!err) 
      dbarr=rows;
     connection.query(qur2,function(err, rows)
    {   
    if(!err) 
      dbarr1=rows;
     connection.query(qur,function(err, rows)
     {   
    if(!err)      
     { 
       res.status(200).json({'returnval': rows,'dbarr':dbarr,'dbarr1':dbarr1});
      }
    else{
      res.status(200).json({'returnval': ''});  
      }
    });
   });});
});

app.post('/SchooltypetoGrademapping-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/masterschoolmapping-service',  urlencodedParser,function (req,res)
{  
   //  var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM master_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
 app.post('/insertschoolTypename-service' , urlencodedParser,function (req, res)
{  
   var collection = {"school_id":req.query.schoolid,"school_type_id":req.query.schooltypeid,"school_type_name":req.query.schooltypes};
  //console.log(JSON.stringify(collection));
   connection.query("SELECT * FROM master_school_type WHERE school_type_id='"+req.query.schooltypeid+"' and school_id='"+req.query.schoolid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO master_school_type SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/Fngradeinsetschool-service' , urlencodedParser,function (req, res)
{  
     
  var collection = {"school_id":req.query.schoolid,"grade_id":req.query.gradeid,"grade_name":req.query.gradename,"school_type":req.query.schooltypeid};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_school_grade_mapping_dummy WHERE school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schooltypeid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_grade_mapping_dummy SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/FnschoolgettheGrade-service',  urlencodedParser,function (req,res)
{  
    var qur="SELECT grade_id,grade_name FROM md_grade where grade_id not in(select grade_id from md_school_grade_mapping_dummy)";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
    //  console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empsubjectTeacher-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_employee where school_id='"+req.query.school_id+"' and role_id='subject-teacher'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empcategory-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_subject_category";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/FnschoolgettheGrade1-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school_grade_mapping_dummy WHERE school_type='"+req.query.schooltypeid+"' and school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));
    if(rows.length==0){
           res.status(200).json({'returnval': 'empty'});
          
        }
       else if(rows.length>0){   
      res.status(200).json({'returnval': 'fill'});
    }
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
/*app.post('/fngetempsubject-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

 if(req.query.categoryid=="category1")
 {  
  qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and school_category_id='"+req.query.categoryid+"' and  langugage_pref='"+req.query.emplangprefernce+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 
}
else 
 {
 qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 

}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});*/
app.post('/emplangschooltypegetcategorywww-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"' and language_pref='"+req.query.language_pref+"'";
     console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/emplangschooltypegetcategorywwws-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"' and language_pref='"+req.query.langugage_pref+"'";
     console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/fnempsubjectdetails-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"emp_id":req.query.emp_id,"emp_name":req.query.emp_name,
  "subjectid":req.query.subjectid,"school_type_id":req.query.schooltypeid,"school_category_id":req.query.categoryid,"flage":req.query.flage,"langugage_pref":req.query.emplanpreff,"academic_year":req.query.academic_year};

 var qur="SELECT * FROM md_employee_subject WHERE school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"' and subjectid='"+req.query.subjectid+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'";
 console.log('--------------------');
 console.log(qur);
 console.log('--------------------');
 connection.query(qur,function(err, rows)
      {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee_subject SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }    
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {   
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });

app.post('/empgetschooltype111-service',  urlencodedParser,function (req,res)

    {    
      var qur="SELECT distinct emp_name,emp_id FROM md_employee_subject where school_id='"+req.query.school_id+"'and school_type_id='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
      console.log(qur);
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });
app.post('/empgetschooltype11-service',  urlencodedParser,function (req,res)

    {    
  // var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
     //   console.log(e);
    var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
    console.log(qur);
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });

app.post('/dynamicinfo-service',  urlencodedParser,function (req,res)


    // app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

    {  
  // var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
     //   console.log(e);
      var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and flage='active'";
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });

app.post('/schooltypegetcategorywww-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"'";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
//fetching student names
app.post('/fetchstudnameforenable-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var gradeid={grade_id:req.query.grade};
  var sectionid={section_id:req.query.section};

  var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"' and feepaid_status='No' and flag='active'";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/deletesubjectz-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_employee_subject where school_id='"+req.query.school_id+"' and emp_id='"+req.query.empid+"' and emp_name='"+req.query.empname+"' and subjectid='"+req.query.subjectid+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"'  and academic_year='"+req.query.academic_year+"'";
  console.log(qur);
    connection.query(qur,function(err, rows)
    {   
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });

 
app.post('/deletesubjectz11-service' ,  urlencodedParser,function (req, res)
{  
   /*      var qur="SELECT * FROM mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'"; 
   */             
    var qur="DELETE FROM   mp_teacher_grade where school_id='"+req.query.school_id+"' and school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'";
  //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
 app.post('/DelteschoolTypename-service' ,  urlencodedParser,function (req, res)
 {  
     // var obj={"schooltypes":"","schooltypeid":"","schoolid":""};
  var qur="DELETE FROM  master_school_type where school_id='"+req.query.schoolid+"' and school_type_id='"+req.query.schooltypeid+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
  app.post('/schooltypegetcategorywww-service',  urlencodedParser,function (req,res)
    {  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/deletesubjectz1-service',  urlencodedParser,function (req,res)
     {  
     var qur="SELECT * FROM mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'";
      //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
        if(rows.length>0){
                res.status(200).json({'returnval': rows});
   
     }
       else if(rows.length==0){
             res.status(200).json({'returnval': 'empty'});
   
         }
     // console.log(JSON.stringify(rows));   
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/tranfersection-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_class_section where class='"+req.query.setgradeid+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empmappingsubject-service',urlencodedParser,function (req,res)
{  

  var qur="SELECT school_id,subjectid,emp_id,emp_name,(select subject_name from md_subject where subject_id =subjectid) as subject FROM md_employee_subject where school_id='"+req.query.school_id+"' and emp_id='"+req.query.empselectid+"' and flage='active' and academic_year='"+req.query.academicyear+"' and school_type_id='"+req.query.schooltype+"'";

  console.log("--------------------------------------------------------------");
 
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnsavesection-service' , urlencodedParser,function (req, res)
{
  //   var obj={"school_id":"","empid":"","empgradeid":"","empsubjectid":"","empsectionid":""};
        
 var collection = {"school_id":req.query.school_id,"id":req.query.empid,"grade_id":req.query.empgradeid,"subject_id":req.query.empsubjectid,"section_id":req.query.empsectionid,"role_id":req.query.rolename,"flage":req.query.flage,"class_id":req.query.empsectionid1,"academic_year":req.query.academic_year,"school_type":req.query.schooltypeid};
   //console.log(JSON.stringify(collection));

connection.query("SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.school_id+"' and id='"+req.query.empid+"' and grade_id='"+req.query.empgradeid+"'and subject_id='"+req.query.empsubjectid+"'  and section_id='"+req.query.empsectionid+"' and role_id='"+req.query.rolename+"'  and class_id='"+req.query.empsectionid1+"' and school_type='"+req.query.schooltypeid+"'  and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO mp_teacher_grade SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/empgetsectionvalues-service',  urlencodedParser,function (req,res)
   {
    // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
var qur="SELECT id,s.grade_id,s.id,section_id ,subject_id,(SELECT id FROM md_class_section where id=s.class_id and school_id='"+req.query.school_id+"') as classid FROM mp_teacher_grade s  where s.school_id='"+req.query.school_id+"' and s.id='"+req.query.empselectid+"' and s.role_id='subject-teacher' and s.academic_year='"+req.query.academic_year+"' and s.school_type='"+req.query.schooltypeid+"'and flage='active'";
  console.log(qur);
    /*  var qur="SELECT id,s.grade_id,s.id,section_id ,subject_id,(SELECT id FROM md_class_section where section=s.section_id and school_id='"+req.query.school_id+"') as classid FROM mp_teacher_grade s  where s.school_id='"+req.query.school_id+"' and s.id='"+req.query.empselectid+"' and s.grade_id='"+req.query.setgradeidz+"' and flage='active'";*/
    //console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));  
       if(rows.length>0) {
      res.status(200).json({'returnval': rows});
    }else{
      res.status(200).json({'returnval': 'empty'});
      
    }
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/getschooltypeas-service',  urlencodedParser,function (req,res)
{  
    var e={school_id:req.query.school_id,school_type:req.query.schooltypename};
   
var qurr="SELECT p.school_type,p.grade_id,p.grade_name,s.section_id,s.class_id FROM md_school_grade_mapping p join mp_grade_section s  on(s.grade_id=p.grade_id) where s.school_id='"+req.query.school_id+"' and p.school_id='"+req.query.school_id+"' and  s.academic_year='"+req.query.academic_year+"'  and p.academic_year='"+req.query.academic_year+"' and p.school_type='"+req.query.schooltypeid+"'";

   var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  // console.log("-------------value------------------------");
 // console.log(qurr);
  //  console.log("-------------value------------------------");
 
  connection.query(qurr,
    function(err, rows)
    {
    if(!err)   
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/getschooltype-service',  urlencodedParser,function (req,res)
{  
    var e={school_id:req.query.school_id,school_type:req.query.schooltypename};
   

   var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empsectionclass-service' ,  urlencodedParser,function (req, res)
{  
 
   var qur="DELETE FROM  mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.employeeidz+"' and grade_id='"+req.query.empgradeidz+"' and subject_id='"+req.query.empsubjectidz+"'and section_id='"+req.query.employeesectionnamez+"' and school_type='"+req.query.schooltypeid+"'";
  //  console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/schoolGradetype-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fngetstudent-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.stugradeid+"' and  academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/FngetStudentpasssection-service',  urlencodedParser,function (req,res)
{  
   var e={school_id:req.query.schoolid};
  var qur="SELECT * FROM md_admission where school_id='"+req.query.school_id+"' and class_for_admission='"+req.query.stugrade+"' and academic_year='"+req.query.academic_year+"' and flag='1' AND active_status='Admitted'";
      console.log(qur);   
      console.log("---------admission-------");   

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
});
app.post('/SchoolCategorytype-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_subject_category";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});  
app.post('/fnsubjecttocategorysaving-service' ,  urlencodedParser,function (req, res)
{    
    var response={
            school_id:req.query.school_id,
            grade_id:req.query.gradename,
            subject_id:req.query.subjectid,
            subject_category:req.query.categoryname,
            school_type_id:req.query.schootypename,
            "academic_year":req.query.academic_year,
            lengpref:req.query.emplanpreff
          };
          
       // console.log(response);
  connection.query("SELECT * FROM mp_grade_subject WHERE school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradename+"' and subject_id='"+req.query.subjectid+"' and subject_category='"+req.query.categoryname+"'  and school_type_id='"+req.query.schootypename+"'and academic_year='"+req.query.academic_year+"'and lengpref='"+req.query.emplanpreff+"'",function(err, rows){
    if(rows.length==0)
    {
      connection.query("INSERT INTO mp_grade_subject SET ? ",[response],
      function(err, rows)
      {


      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/fngetThefunction-service',  urlencodedParser,function (req,res)
{  
  var qur;

     if(req.query.schooltypesubjectid=="category1"){

    qur="select * FROM  mp_grade_subject where  school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and subject_category='"+req.query.schooltypesubjectid+"' and lengpref='"+req.query.lengpref+"' and academic_year='"+req.query.academic_year+"'";
   }
    else{
     qur="select * FROM  mp_grade_subject where  school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and subject_category='"+req.query.schooltypesubjectid+"'and academic_year='"+req.query.academic_year+"'";

 }
//  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else   
     
      res.status(200).json({'returnval': ''});
  });
});

  




app.post('/fngetempsubject-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

 if(req.query.categoryid=="category1")
 {  
  qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and school_category_id='"+req.query.categoryid+"' and  langugage_pref='"+req.query.emplangprefernce+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 
}
else 
 {
 qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 
 }
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});






app.post('/Fngetcategoryandsubject-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="Delete from mp_grade_subject where school_id='"+req.query.school_id+"'and subject_id='"+req.query.subjectname+"' and grade_id='"+req.query.gradename+"' and subject_category='"+req.query.categoryname+"'and school_type_id='"+req.query.schootypename+"' and academic_year='"+req.query.academic_year+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);

      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});


app.post('/deleteschooltype-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_school_type where  school_type_id='"+req.query.schooltypeid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {  
      res.status(200).json({'returnval': 'Deleted!'});


    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/FnselecttoSection-service' ,urlencodedParser,
  function (req, res)

{  
  
  var qur1="select * from md_class_section where school_id='"+req.query.subjectselectid+"'and class='"+req.query.FnStosGradeid+"'  and academic_year='"+req.query.acadamicyear+"' and id in (SELECT distinct class_id FROM `md_student` WHERE  grade_id='"+req.query.gradeid+"'  and academic_year='"+req.query.acadamicyear+"' and school_id='"+req.query.subjectselectid+"' and flag='active')";

 // console.log(qur1);
  connection.query(qur1,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
       //console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });
});
app.post('/SbjecttoStudentmapping-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.subjectselectid};
  var gradeid={grade_id:req.query.FnStosGradeid};
  var sectionid={section_id:req.query.FnStoSSectionid};
  
     var quer="SELECT * FROM md_student where  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"' and class_id='"+req.query.class_id+"' and flag='active'";
  connection.query(quer,function(err, rows){
     if(!err){

      res.status(200).json({'returnval': rows});
         }

    else
      res.status(200).json({'returnval': 'Fail!'});
    
    });
});     


//enable student names
app.post('/enablestudent-service',  urlencodedParser,function (req,res)
{   
  var qur="update md_student set feepaid_status='Yes' where school_id='"+req.query.schoolid+"' and feepaid_status='No' and id='"+req.query.studentid+"' and flag='active'";


  connection.query(qur,
    function(err, rows)
    {
    if(!err)

    {  
      res.status(200).json({'returnval': 'Enabled successfully!!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Unable to process!'});
    }  

  });
});    
app.post('/FnSubjecttostudentlanguage-service',  urlencodedParser,function (req, res)
{
    
  connection.query('SELECT * from md_subject where language_pref="Second Language"',
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/SbjecttoStudentmapping1-service',  urlencodedParser,function (req, res)
{
      var qur='SELECT * from tr_student_to_subject where school_id="'+req.query.subjectselectid+'"and academic_year="'+req.query.FnStoStermid+'" and grade="'+req.query.FnStosGradeid+'" and class_id="'+req.query.FnStoSSectionid+'" and flag="active"';

      console.log("--------------------------------------");
     console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/FnSubjecttostudentthirdlanguage-service',  urlencodedParser,function (req, res)
{
connection.query("SELECT * from md_subject where language_pref!='Core subject' and subject_category='category1'",
    function(err, rows)
    {
    if(!err)
    {   
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/FnSecondLangSubjectToStudent-service' , urlencodedParser,function (req, res)
{  
    var response={
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
     lang_pref:req.query.langugagepref,
     flag:'active'
    }; 
     // console.log(response);

var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and flag='active' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and  class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
 

 
  var qur1=  "update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where school_id='"+req.query.schoolnames+"' and flag='active' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_id='"+req.query.studentid+"' and class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
   
    console.log(qur);
   console.log(qur1);
   
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);

      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
        //  console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
    });

app.post('/FnSecondLangSubjectToStudentsets-service' , urlencodedParser,function (req, res)
{  
  
  var response={
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
     lang_pref:req.query.langugagepref,
     flag:'active'
      //studentid,studentname,schoolnames,termsname,gradenamesssss,Sectionnames,seclang,thirdlang,Sectionnameseeee
    }; 
     console.log(response);
// 
var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and  class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"' and flag='active'";
 

 
  var qur1=  "update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where school_id='"+req.query.schoolnames+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_id='"+req.query.studentid+"' and class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"' and flag='active'";
   
    console.log(qur);
   console.log(qur1);
   
  
     connection.query(qur,function(err, rows)
    {
      if(!err){
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          //console.log('update');
        if(!err)
        {
         res.status(200).json({'returnval': 'updated successfully'}); 
        }  
        
        else
        {
          res.status(200).json({'returnval': 'not updated'});
        }
        
        });
        } 
      }
      else
        console.log(err);
      });
 });

app.post('/FnThirdLangSubjectToStudent-service' , urlencodedParser,function (req, res)
{  
    var response={

     
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
       lang_pref:req.query.langugagepref,
       flag:'active'
  
    }; 

    //console.log(JSON.stringify(response));
 var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionname+"' and  student_name='"+req.query.studentname+"' and lang_pref='"+req.query.langugagepref+"' and flag='active'";


   
    var qur1="update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolnames+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_name='"+req.query.studentname+"'and class_id='"+req.query.sectionid+"'and lang_pref='"+req.query.langugagepref+"' and flag='active'";

   connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          //console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
 });

app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from md_school where id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          //console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
   app.post('/SelectSchoolgrades-service' ,urlencodedParser,
  function (req, res)

{  
  var qur="select grade_id,grade_name from md_grade";
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
       //console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});


app.post('/fetchschooltypename-service',  urlencodedParser,function (req,res)
{ 
  var qur="SELECT * FROM md_school_type";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
       else if(rows.length==0|| row.length==null)
        { 
          //console.log(JSON.stringify(rows));  
          res.status(200).json({'returnval': 'empty'});
        }
    }
          
    else
      res.status(200).json({'returnval': 'invalid'});
    });
    
});
app.post('/selectschooltype1-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from master_school_type where school_id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }
   
        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });

app.post('/selectschoolnames-service' ,urlencodedParser, function (req, res)
    {  
      var qur="select * from md_school";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }
   
        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });


app.post('/studentsectiontype-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      ///console.log(e);
      var qur="select * from master_school_type where school_id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
app.post('/fnretrivestudent-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      ///console.log(e);
      var qur="select * from md_student where school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
     console.log(qur);
     console.log("-----------student------------");
      connection.query(qur,function(err, rows){
        if(!err){
          res.status(200).json({'returnval': rows});
          // console.log(rows);
        }
        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
    });





/*app.post('/fnsetstudentinfo-service' , urlencodedParser,function (req, res)
{  
    var obj={"school_id":"","id":"","student_name":"","school_type":"","dob":"","Gender":"","studentclassid":""};
     
    var response={

     
      school_id:req.query.school_id,
      id:req.query.id,
      student_name:req.query.student_name,
      class_id:req.query.studentclassid,
      dob:req.query.dob,
      school_type:req.query.school_type,
      gender:req.query.Gender,
      //studentid,studentname,schoolnames,termsname,gradenamesssss,Sectionnames,seclang,thirdlang,Sectionnameseeee
    }; 

    console.log(JSON.stringify(response));
   var qur= "SELECT * FROM  md_student WHERE school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and student_name='"+req.query.student_name+"' and class_id='"+req.query.studentclassid+"'";
   
    
    var qur1="update md_student set class_id='"+req.query.studentclassid+"' where school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and student_name='"+req.query.student_name+"'";

    console.log(qur);
    console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
connection.query("INSERT INTO md_student SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);

      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }

    else{
     // res.status(200).json({'returnval':rows});

        connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
    });*/


app.post('/fnsetstudentinfo-service' , urlencodedParser,function (req, res)
{  
   var response={

     
      school_id:req.query.school_id,
      id:req.query.id,
      student_name:req.query.student_name,
      class_id:req.query.classid,
      dob:req.query.dob,
      school_type:req.query.school_type,
      gender:req.query.Gender,
      grade_id:req.query.stugradeid,
      academic_year:req.query.academic_year,
      flag:'active'
      }; 
    var qur= "SELECT * FROM  md_student WHERE school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and student_name='"+req.query.student_name+"' and  academic_year='"+req.query.academic_year+"' and   grade_id='"+req.query.stugradeid+"'and flag='active'";
   
    var qur1="update md_student set class_id='"+req.query.classid+"',school_type='"+req.query.school_type+"' where school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and  grade_id='"+req.query.stugradeid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
   
   var qur3="update tr_student_to_subject set class_id='"+req.query.classid+"',section='"+req.query.sectionname+"' where school_id='"+req.query.school_id+"' and student_id='"+req.query.id+"' and grade='"+req.query.stugradeid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";

   console.log("-----------Student mapping-------------");
   console.log(qur);
   console.log(qur1)
   console.log(qur3)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     // console.log('1');
     connection.query("INSERT INTO md_student SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, result){  
        if(!err) 
        {
       connection.query(qur3,function(err, result){  
        if(!err)
        {
        res.status(200).json({'returnval': 'updated successfully'});
       }
       else
        res.status(200).json({'returnval': 'not updated'});
      });
     }
    });
    }
     
   });
});




app.post('/fetchschooltypesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM master_school_type where school_id='"+req.query.schoolid+"' ";
   // console.log('------------school type-------------');
    //console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchgradesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.schoolid+"' and school_type='"+req.query.type+"' and academic_year='"+req.query.academicyear+"'";
   // console.log('------------school grade-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchrolesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_role where priority='1'";
   // console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


app.post('/generateroletogrademappinginfo-service',  urlencodedParser,function (req,res)
  {  
    var qur1="SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"'";
    var qur2="SELECT *,g.grade_id FROM md_class_section c join md_grade g on (g.grade_name=class) WHERE school_id='"+req.query.schoolid+"' and class='"+req.query.gradename+"' and academic_year='"+req.query.academicyear+"'";
    var qur3="select * from employee_to_school_type_category_mapping m join md_employee e "+
             "on(m.emp_id=e.id) where m.school_id='"+req.query.schoolid+"' and e.school_id='"+req.query.schoolid+"' and  "+
             "e.academic_year='"+req.query.academicyear+"' and m.academic_year='"+req.query.academicyear+"' and "+
             "m.school_type='"+req.query.type+"' and e.role_id='"+req.query.roleid+"' and m.flage='active'";
   // console.log('------------school role-------------');
    //console.log(qur1);
    //console.log('------------------------------------');
    //console.log(qur2);
    //console.log('------------------------------------');
    //console.log(qur3);
    //console.log('------------------------------------');
    var maparr=[];
    var secarr=[];
    var emparr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    maparr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    secarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    { 
    emparr=rows;
      res.status(200).json({'maparr': maparr,'secarr':secarr,'emparr':emparr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/generateroletogrademappinginfo-service1',  urlencodedParser,function (req,res)
  {  
    var qur1="SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"'";
    var qur2="SELECT * FROM md_school_grade_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and school_type='"+req.query.type+"'";
    var qur3="select * from employee_to_school_type_category_mapping m join md_employee e "+
             "on(m.emp_id=e.id) where m.school_id='"+req.query.schoolid+"' and e.school_id='"+req.query.schoolid+"' and  "+
             "e.academic_year='"+req.query.academicyear+"' and m.academic_year='"+req.query.academicyear+"' and "+
             "m.school_type='"+req.query.type+"' and e.role_id='"+req.query.roleid+"' and m.flage='active'";
   // console.log('------------school role-------------');
    //console.log(qur1);
    //console.log('------------------------------------');
    //console.log(qur2);
    //console.log('------------------------------------');
    //console.log(qur3);
    //console.log('------------------------------------');
    var maparr=[];
    var secarr=[];
    var emparr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    maparr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    secarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    { 
    emparr=rows;
      res.status(200).json({'maparr': maparr,'secarr':secarr,'emparr':emparr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/deletegraddeleteetorolemapping-service',  urlencodedParser,function (req,res)
  {  
    if(req.query.roleid=='class-teacher')
    var qur="DELETE FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.class+"' "+
    " and school_type='"+req.query.schooltype+"' and role_id='"+req.query.roleid+"'";
    if(req.query.roleid=='co-ordinator'||req.query.roleid=='headmistress')
    var qur="DELETE FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' "+
    " and school_type='"+req.query.schooltype+"' and role_id='"+req.query.roleid+"'";
    console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/savegradetorolemapping-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO mp_teacher_grade SET ?";
    var response={
      school_id:req.query.schoolid,
      id:req.query.empid,
      grade_id:req.query.class,
      subject_id:"",
      role_id:req.query.roleid,
      section_id:req.query.section,
      flage:req.query.flage,
      class_id:req.query.classid,
      academic_year:req.query.academicyear,
      school_type:req.query.schooltype
    };
    console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});
/*app.post('/singlestudentservice-service',  urlencodedParser,function (req,res)
  {  var qur="INSERT INTO single_student_markentry_table SET ?";

    var qur1="Select *  from single_student_markentry_table where   school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and  subject_id='"+req.query.subject+"'";

    var response={
      school_id:req.query.schoolid,
      student_id:req.query.studentid,
      student_name:req.query.studentname,
      subject_category:req.query.subjectcategory,
      assesment_id:req.query.assesmentid,
      grade:req.query.grade,
      section:req.query.section,
      subject:req.query.subject,
      academic_year:req.query.academic_year,
      term_id:req.query.termname,
      flag:req.query.flag,
      comments:req.query.comments,
      };
     console.log('------------ single mark entry-------------');
     console.log(qur);
     console.log(response);
    
 connection.query(qur1,
    function(err, rows)
    {
     
    if(!err)
    {   
      if(row.length==0){
          connection.query(qur,[response],function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': "inserted"});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
      });
      }
      res.status(200).json({'returnval': "inserted"});
    }
   
  });

  
});

*/



app.post('/singlestudentservice-service' , urlencodedParser,function (req, res)
{  
    var response={
      school_id:req.query.schoolid,
      student_id:req.query.studentid,
      student_name:req.query.studentname,
      subject_category:req.query.subjectcategory,
      assesment_id:req.query.assesmentid,
      grade:req.query.grade,
      section:req.query.section,
      subject:req.query.subject,
      academic_year:req.query.academic_year,
      term_id:req.query.termname,
      flag:req.query.flag,
      comments:req.query.comments,
    };
      console.log(response);
     var qur="Select *  from single_student_markentry_table where   school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and  subject='"+req.query.subject+"' and student_id='"+req.query.studentid+"' and flag='processing'";

     var qur1="update single_student_markentry_table set comments='"+req.query.comments+"'  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and  section='"+req.query.section+"' and  subject='"+req.query.subject+"'   and student_id='"+req.query.studentid+"' and flag='processing'";

    console.log("++++++++++++++++++++++");
    console.log(qur);
    console.log(qur1);
    console.log("+++++++++++++++++++++++")
    connection.query(qur, function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO single_student_markentry_table SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});


app.post('/gradesforenrichment-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * from md_school_grade_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    console.log('------------Enrichment grades-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/gradelevelforenrichment-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * from md_grade_rating";
    console.log('------------Enrichment gradelevels-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


app.post('/subjectforenrichment-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT distinct(subject_id),subject_name from enrichment_subject_category";
    console.log('------------Enrichment subjects-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/categoryforenrichment-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT distinct(category_id),category_name from enrichment_subject_category WHERE subject_id='"+req.query.subjectid+"'";
    console.log('------------Enrichment category-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchexistingbooks-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT distinct(id),book_name FROM enrichment_booksactivity_master WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND category='"+req.query.categorytype+"'";
    console.log('------------Enrichment books-------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchselectedbookinfo-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_booksactivity_master WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND id='"+req.query.bookid+"'";
    console.log('------------Enrichment books-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/generatebooksequence-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT bookactivity_seq FROM sequence";
    console.log('------------book seq-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/FnSetschoolInfo1-service',  urlencodedParser,function (req,res)
  {  
    var response={
         school_id:req.query.school,
         emp_prefix:'STF'+req.query.uschoolid+'00',
         emp_sequence:'1',
         sec_prefix:'CLS'+req.query.uschoolid+'00',
         sec_sequence:'1',
    };
     console.log(response);
    var qur="INSERT INTO school_sequence SET ?";
    console.log('------------book insert-------------');
    console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Inserted!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Inserted!!'}); 
    }
  });
});

app.post('/FnSetschoolInfo2-service',  urlencodedParser,function (req,res)
  {  
    var response={
         school_id:req.query.school,
         id:req.query.shortname,
            role_id:'schooladmin',
         password:req.query.shortname,
         name:req.query.shortname,
         flage:'active',
         academic_year:'',
    };
     console.log(response);
    var qur="INSERT INTO md_employee SET ?";
    console.log('------------book insert-------------');
    console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Inserted!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Inserted!!'}); 
    }
  });
});
app.post('/insertbookinfo-service',  urlencodedParser,function (req,res)
  {  
    var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         id:req.query.bookid,
         book_name:req.query.bookname,
         author_name:req.query.bookauthor,
         subject_id:req.query.booksubid,
         subject_name:req.query.booksubname,
         category_id:req.query.bookcatid,
         category_name:req.query.bookcatname,
         grade_id:req.query.bookgradeid,
         grade_name:req.query.bookgradename,
         grade_level:req.query.bookgrade,
         quantity:req.query.bookquantity,
         category:req.query.category,
         assesment_type:req.query.assesmenttype
    };
    // console.log(response);
    var qur="INSERT INTO enrichment_booksactivity_master SET ?";
    console.log('------------book insert-------------');
    console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Inserted!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Inserted!!'}); 
    }
  });
});


app.post('/updatebooksequence-service',  urlencodedParser,function (req,res)
  {  
    var qur="UPDATE sequence SET bookactivity_seq='"+req.query.seq+"'";
    console.log('------------book seq-------------');
   console.log(qur);
    connection.query(qur,
    function(err, result)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fetchsubjectcategoryforissue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT distinct(category_name),category_id FROM enrichment_subject_category WHERE subject_id='"+req.query.subjectid+"'";
    console.log('------------fetch book category-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/fetchstudentforissue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_student WHERE class_id in(SELECT class_id FROM mp_grade_section WHERE grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active'";
    console.log('------------fetch stud for book issuance-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/fetchstudentcategoryforissue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT  * FROM enrichment_grade_master WHERE subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesment+"'";
    console.log('------------fetch grade for issuance-------------');
   console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/fetchstudentbylevel-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT  distinct(student_name),student_id FROM tr_beginner_assesment_marks WHERE assesment_type='"+req.query.assesment+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"' and grade='"+req.query.grade+"'";
    var bookqur="SELECT * FROM enrichment_booksactivity_master WHERE  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"' and grade_level='"+req.query.grade+"'";
   console.log('------------fetch stud for book issuance-------------');
   console.log(qur);
   console.log(bookqur);
    var studarr=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      studarr=rows;
      connection.query(bookqur,function(err, rows){
      if(!err)
      res.status(200).json({'studarr':studarr,'returnval': rows});
      });
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/fetchbookforstudent-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_booksactivity_master WHERE grade_level in(SELECT grade FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and assesment_type='"+req.query.assesmenttype+"' and grade_id='"+req.query.gradename+"' and section_id='"+req.query.sectionname+"' and subject_id='"+req.query.subjectname+"' and category_id='"+req.query.categoryname+"' and student_id='"+req.query.studentid+"')";
    console.log('------------fetch stud for book issuance-------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});



app.post('/assignbooktostudent-service' , urlencodedParser,function (req, res)
{  
       
  var collection = {
      school_id:req.query.schoolid,
      academic_year:req.query.academicyear,
      student_id:req.query.studentid,
      student_name:req.query.studentname,
      assesment_type:req.query.assesmenttype,
      grade:req.query.gradename,
      section:req.query.sectionname,
      subject:req.query.subjectname,
      category:req.query.categoryname,
      bookactivity_id:req.query.bookid,
      bookactivity_name:req.query.bookname,
      quantity:'1',
      issued_date:req.query.issuedate,
      due_date:req.query.duedate,
      status:'issued'
    };
   console.log(JSON.stringify(collection));
 connection.query("SELECT * FROM enrichment_bookissuance_details WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'and student_id='"+req.query.studentid+"'and assesment_type='"+req.query.assesmenttype+"' and grade='"+req.query.gradename+"'and section='"+req.query.sectionname+"'and subject='"+req.query.subjectname+"' and category='"+req.query.categoryname+"'and bookactivity_id='"+req.query.bookid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
   connection.query("INSERT INTO enrichment_bookissuance_details SET ?",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });










app.post('/fetchissuedbook-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_bookissuance_details WHERE student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and status='issued'";
    console.log('------------fetch issued book -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/fetchdueinfo-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_bookissuance_details WHERE student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    console.log('------------fetch issued book -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/fetchevaluationparameters-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_evaluation_parameter_mapping WHERE book_id='"+req.query.bookid+"'";
    console.log('------------fetch issued book -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/updateassesmentstatus-service',  urlencodedParser,function (req,res)
  {  
    var response={
      school_id:req.query.schoolid,
      academic_year:req.query.academicyear,
      student_id:req.query.studentid,
      student_name:req.query.studentname,
      assesment_type:req.query.assesmenttype,
      grade:req.query.gradename,
      section:req.query.sectionname,
      subject:req.query.subject,
      category:req.query.category,
      bookactivity_id:req.query.bookid,
      bookactivity_name:req.query.bookname,
      evaluation_date:req.query.returndate,
      parameter_id:req.query.paramid,
      parameter_name:req.query.paramname
    };
    var qur="INSERT INTO enrichment_assesment_details SET ?";
    console.log('------------insert assesment -------------');
    console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});

app.post('/updatereturnstatus-service',  urlencodedParser,function (req,res)
  {  
    var qur="UPDATE enrichment_bookissuance_details SET status='Returned',returned_date='"+req.query.returndate+"' "+
    " WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' and "+
    " assesment_type='"+req.query.assesmenttype+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and "+
    " category='"+req.query.category+"' and bookactivity_id='"+req.query.bookid+"'";
    console.log('------------update return status -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fetchperformancemeasures-service',  urlencodedParser,function (req,res)
  {  
    var beginnerqur="SELECT academic_year,sub_category_name,sub_category_id,assesment_type,student_id,student_name,subject_id,category_id,category_name,score,grade FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and student_id='"+req.query.studentid+"' and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"'  group by assesment_type,category_id,student_id,student_name,subject_id,score,grade,category_name,sub_category_name,sub_category_id,academic_year";
    // var assignedqur="SELECT * FROM enrichment_bookissuance_details WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"'";
    var assignedqur="SELECT * FROM enrichment_bookissuance_details bi join enrichment_evaluation_parameter_mapping m "+
    " on(bi.bookactivity_id=m.book_id) WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"'";
    var assesmentqur="SELECT * FROM enrichment_assesment_details WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"'";
    var totalassesment="SELECT * FROM enrichment_evaluation_parameter_mapping";

    console.log('------------fetch perfomance measures -------------');
    console.log(beginnerqur);
    console.log('---------------------------------------------------');
    console.log(assignedqur);
    console.log('---------------------------------------------------');
    console.log(assesmentqur);
    console.log('---------------------------------------------------');
    console.log(totalassesment);
    console.log('---------------------------------------------------');
    var begin=[];
    var assign=[];
    var assesment=[];
    var totalasses=[];
    connection.query(beginnerqur,function(err, rows)
    {
    if(!err)
    {  
      begin=rows;
    connection.query(assignedqur,function(err, rows)
    {
    if(!err)
    {  
      assign=rows; 
    connection.query(assesmentqur,function(err, rows)
    {
    if(!err)
    {  
      assesment=rows;
    connection.query(totalassesment,function(err, rows)
    {
    if(!err)
    {  
      totalasses=rows; 
      res.status(200).json({'beginner': begin,'assigned':assign,'assesment':assesment,'totalassesment':totalasses});
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
    });
    }
    else{
     console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/fetchallbooks-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT grade_id,id,book_name,subject_name,category_name,quantity,category FROM enrichment_booksactivity_master where grade_id "+
  "in(select grade_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' group by id,book_name,subject_name,category_name,quantity,category";
    console.log('------------fetch issued book -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/fetchallevaluationparameters-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM enrichment_evaluation_parameter";
    console.log('------------fetch issued book -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/insertenrichmentparametermapping-service',  urlencodedParser,function (req,res)
  {  
    var response={
      book_id:req.query.bookid,
      parameter_id:req.query.paramid,
      parameter_name:req.query.paramname
    };
    var qur="INSERT INTO enrichment_evaluation_parameter_mapping SET ?";
    console.log('------------insert eval param mapping -------------');
    console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fetchinfoforsubjecttemplate-service',  urlencodedParser,function (req,res)
  {  
    var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' group by subject_id,subject_name,category_id,category_name";
    var qur="SELECT * FROM subject_mapping WHERE  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' order by category_id";
    var auditarr="SELECT  * from tr_term_auditimport WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";
    console.log('------------subject template-------------');
    console.log('-------------------------');
    console.log(auditarr);
    console.log('------------------------');
    console.log(qur);
    console.log(categorycnt);
   
    var cnt=[];
    var auditarr1=[];
    connection.query(categorycnt,function(err, rows)
    {
    if(!err)
    {    
    cnt=rows;
    connection.query(auditarr,function(err, rows)
    {
    if(!err)
    {    
    auditarr1=rows;
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'auditarr':auditarr1,'catarr':cnt,'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
  }
   });
  }
  });
});

/*app.post('/fetchinfoforsubjecttemplate-service',  urlencodedParser,function (req,res)
  {  
    var categorycnt="SELECT subject_id,subject_name,count(category_id) as cnt FROM subject_mapping WHERE academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' group by subject_id,subject_name";
    var qur="SELECT * FROM subject_mapping WHERE  academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' order by category_id";
    console.log('------------subject template-------------');
    console.log(qur);
    console.log(categorycnt);
    var cnt=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'catarr':cnt,'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});*/

app.post('/fetchinfoforcosubjecttemplate-service',  urlencodedParser,function (req,res)
  {  
    var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' group by subject_id,subject_name,category_id,category_name";
    var qur="SELECT * FROM subject_mapping WHERE  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' order by category_id";
    console.log('------------subject template-------------');
    console.log(qur);
    console.log(categorycnt);
    var cnt=[];
    connection.query(categorycnt,function(err, rows)
    {
    if(!err)
    {    
    cnt=rows;
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'catarr':cnt,'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
  }
  });
});


app.post('/fetchscholasticmarksavedstudents-service',  urlencodedParser,function (req,res)
  {  
   // if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
   // else
   var qur="SELECT count(distinct(student_id)) as total FROM tr_term_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"'";
    console.log('------------approval student count-------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});  

app.post('/fetchscholasticmarksavedstudents1-service',  urlencodedParser,function (req,res)
  {  
  
    var qur="SELECT count(distinct(student_id)) as total FROM tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";
    console.log('------------approval student count-------------');
    console.log(qur);
    
    var cnt=[];     
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/fetchmarksavedstudents-service',  urlencodedParser,function (req,res)
  {  
   // if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
   // else
   var qur="SELECT count(distinct(student_id)) as total FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"'"+
    " and grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"'";
    console.log('------------approval student count-------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});

app.post('/scholasticsubjectsubmittedcheck1-service',  urlencodedParser,function (req,res)
  { 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'  and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'  and flag in('1')";  
    console.log('------------subject approval-------------');
    console.log(checkqur);
    
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0)
      res.status(200).json({'returnval': 'exist'});
      else
      res.status(200).json({'returnval': 'not exist'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});



app.post('/scholasticsubjectsubmittedcheck-service',  urlencodedParser,function (req,res)
  { 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('1')";  
    console.log('------------subject approval-------------');
    console.log(checkqur);
    
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0)
      res.status(200).json({'returnval': 'exist'});
      else
      res.status(200).json({'returnval': 'not exist'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});


app.post('/subjectsubmittedcheck-service',  urlencodedParser,function (req,res)
    { 
    if(req.query.flag=='0')
     var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('0','1')";
    else
     var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('1')";  
    console.log('------------subject approval-------------');
    console.log(checkqur);
    
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0)
      res.status(200).json({'returnval': 'exist'});
      else
      res.status(200).json({'returnval': 'not exist'});
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});

app.post('/subjectscholasticapproval-service',  urlencodedParser,function (req,res)
  { 
   var data={
    school_id:req.query.schoolid,
    academic_year:req.query.academicyear,
    term_name:req.query.termname,
    assesment_id:req.query.assesment,
    grade:req.query.gradename,
    section:req.query.section,
    subject:req.query.subject,
    flag:req.query.flag
    } 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('1')";
    if(req.query.flag=='0')
    var qur="insert into tr_term_assesment_import_marks set ? ";
    if(req.query.flag=="1")
    var qur="update tr_term_assesment_import_marks set ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag='0'";

    console.log('------------subject approval-------------');
    console.log(checkqur);
    console.log('------------------------------------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0){
      if(req.query.flag=='0')  
      res.status(200).json({'returnval': 'exist'});
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
      }
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});

app.post('/subjectscholasticapproval1-service',  urlencodedParser,function (req,res)
  { 
   var data={
    school_id:req.query.schoolid,
    academic_year:req.query.academicyear,
    term_name:req.query.termname,
    assesment_id:"",
    grade:req.query.gradename,
    section:req.query.section,
    subject:req.query.subject,
    flag:req.query.flag
    } 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'  and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'  and flag in('1')";
    if(req.query.flag=='0')
    var qur="insert into tr_term_fa_assesment_import_marks set ? ";
    if(req.query.flag=="1")
    var qur="update tr_term_fa_assesment_import_marks set ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and flag='0'";

    console.log('------------subject approval-------------');
    console.log(checkqur);
    console.log('------------------------------------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0){
      if(req.query.flag=='0')  
      res.status(200).json({'returnval': 'exist'});
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
      }
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});



app.post('/subjectscholasticapproval-service',  urlencodedParser,function (req,res)
  { 
   var data={
    school_id:req.query.schoolid,
    academic_year:req.query.academicyear,
    term_name:req.query.termname,
    assesment_id:req.query.assesment,
    grade:req.query.gradename,
    section:req.query.section,
    subject:req.query.subject,
    flag:req.query.flag
   } 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('1')";
    if(req.query.flag=='0')
    var qur="insert into tr_term_fa_assesment_import_marks set ? ";
    if(req.query.flag=="1")
    var qur="update tr_term_fa_assesment_import_marks set ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and"+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag='0'";

    console.log('------------subject approval-------------');
    console.log(checkqur);
    console.log('------------------------------------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0){
      if(req.query.flag=='0')  
      res.status(200).json({'returnval': 'exist'});
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
      }
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});








app.post('/subjectapproval-service',  urlencodedParser,function (req,res)
  { 
   var data={
    school_id:req.query.schoolid,
    academic_year:req.query.academicyear,
    term_name:req.query.termname,
    assesment_id:req.query.assesment,
    grade:req.query.gradename,
    section:req.query.section,
    subject:req.query.subject,
    flag:req.query.flag
   } 
    if(req.query.flag=='0')
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('0','1')";
    else
    var checkqur="SELECT * FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag in('1')";
    if(req.query.flag=='0')
    var qur="insert into tr_term_fa_assesment_import_marks set ? ";
    if(req.query.flag=="1")
    var qur="update tr_term_fa_assesment_import_marks set ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and "+
    " grade='"+req.query.gradename+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and flag='0'";

    console.log('------------subject approval-------------');
    console.log(checkqur);
    console.log('------------------------------------------');
    console.log(qur);
    
    var cnt=[];
    connection.query(checkqur,function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0){
      if(req.query.flag=='0')  
      res.status(200).json({'returnval': 'exist'});
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
      }
      else{
        connection.query(qur,[data],function(err, result){
          if(!err){
          if(result.affectedRows>0)
            res.status(200).json({'returnval': 'done'});
          }
          else
            console.log('err.......'+err);
        });
      }
    }
    else{
      console.log(err);
     res.status(200).json({'returnval': 'Error'}); 
    }
  });
});

app.post('/fetchenrichmentgrade-service',  urlencodedParser,function (req,res)
{  
    var qur="SELECT * FROM enrichment_grade_master WHERE subject_name='"+req.query.subject+"' and "+
    " assesment_type='"+req.query.assesment+"' and subject_category in(SELECT category_name FROM "+
    " enrichment_subject_mapping WHERE subject_name='"+req.query.subject+"' and "+
    " assesment_type='"+req.query.assesment+"' and grade_name='"+req.query.grade+"' and "+
    " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
    var qur1="SELECT * FROM enrichment_detail_grade_master WHERE"+
    " assesment_type='"+req.query.assesment+"' and subject_category in(SELECT category_name FROM "+
    " enrichment_subject_mapping WHERE subject_name='"+req.query.subject+"' and "+
    " assesment_type='"+req.query.assesment+"' and grade_name='"+req.query.grade+"' and "+
    " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
    var qur2=" SELECT * FROM enrichment_subject_mapping WHERE subject_name='"+req.query.subject+"' and "+
    " assesment_type='"+req.query.assesment+"' and grade_name='"+req.query.grade+"' and "+
    " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    console.log('------------enrichment grade master-------------');
    console.log(qur);
    console.log(qur1);
    console.log(qur2);
    var grade=[];
    var detail=[];
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {   
      grade=rows; 
    connection.query(qur1,function(err, rows)
    {
    if(!err)
    { 
      detail=rows;
    connection.query(qur2,function(err, rows)
    {
    if(!err)
    { 
      console.log('length----------------------'+rows[0].weight);
      res.status(200).json({'weight':rows[0].weight,'detail': detail,'master':grade});
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
  });
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/enrichmentsubject-service',  urlencodedParser,function (req,res)
{  
    var qur="SELECT distinct(subject_id),subject_name FROM enrichment_subject_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.gradename+"' and  assesment_type='"+req.query.assesmentname+"'";
    console.log('------------enrichment_subject_mapping-------------');
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': 'no rows'}); 
    }
  });
});


app.post('/Selectemp-service' ,urlencodedParser,
  function (req, res)

{  
 /* var qur="select distinct id,(select emp_name from md_employee_creation where emp_id=id and school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"') as name from mp_teacher_grade where school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"' and flage='active'";*/
 var qur="select emp_id,emp_name from md_employee_creation where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
    console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
    //  console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});



app.post('/Selectempschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/empreport-service' ,urlencodedParser,
  function (req, res)

{  
   var em={school_id:req.query.school_id,academic_year:req.query.academic_year,id:req.query.empid};
  var qur="SELECT s.id,p.grade_id,UPPER(p.grade_name)as grade_name,UPPER(s.section_id) as section_id,r.subject_id,UPPER(r.subject_name) as subject_name,(Select UPPER(emp_name) from md_employee_creation WHERE  emp_id=id and school_id= '"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"') as name FROM  mp_teacher_grade s join md_grade p on (s.grade_id=p.grade_id) join  md_subject r  on(s.subject_id=r.subject_id)  WHERE s.school_id= '"+req.query.school_id+"' and  s.academic_year='"+req.query.academic_year+"' and s.id='"+req.query.id+"'";
  console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
    //  console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});

app.post('/emplschooltypezzz-service',  urlencodedParser,function (req, res)
{

 var qur="select distinct(t.id),t.subject_id,t.grade_id,UPPER(t.section_id)as section_id,UPPER(e.emp_name)as emp_name,(select UPPER(grade_name) from md_grade g where g.grade_id=t.grade_id)as grade_name,(select UPPER(subject_name) from md_subject  where subject_id=t.subject_id)as subject_name from mp_teacher_grade t join md_employee_creation e  on(e.emp_id=t.id) where t.school_id='"+req.query.school_id+"' and t.academic_year='"+req.query.academic_year+"' and t.school_type='"+req.query.schooltypeid+"' and e.school_id='"+req.query.school_id+"'and e.academic_year='"+req.query.academic_year+"' and t.role_id LIKE '%subject-teacher%'  order by grade_id" ;

  console.log("----------Employee with School type----------");
  console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/studentgrade-service',  urlencodedParser,function (req,res)
{
  var qur1="SELECT grade_name,grade_id FROM md_school_grade_mapping where school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academic_year+"'";
//  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
         // console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});



app.post('/selectclass-service',  urlencodedParser,function (req,res)
{
 
/* var qur="SELECT UPPER(section_id),class_id FROM master.mp_grade_section where school_id='"+req.query.schlid+"' and grade_id='"+req.query.gradeid+"' and  academic_year='"+req.query.academic_year+"'";*/

 var qur="SELECT UPPER(p.section_id)as section_id, p.class_id FROM md_school_grade_mapping s join mp_grade_section p  on s.grade_id=p.grade_id  where p.school_id='"+req.query.schlid+"' and s.school_id='"+req.query.schlid+"' and p.grade_id='"+req.query.gradeid+"' and p.academic_year='"+req.query.academic_year+"' and s.academic_year='"+req.query.academic_year+"'";
  console.log(qur);

   connection.query(qur,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});


app.post('/selectallsection-service',  urlencodedParser,function (req,res)
{
  var qur1="select s.id,s.student_name,g.grade_name,a.admission_status,(select UPPER(section_id) from mp_grade_section ss where ss.grade_id='"+req.query.gradeid+"' and ss.class_id=s.class_id) as section from md_student s join md_school_grade_mapping g on (s.grade_id=g.grade_id) join md_admission a on(s.id=a.admission_no) where s.school_id='"+req.query.schlid1+"' and a.school_id='"+req.query.schlid1+"' and g.school_id='"+req.query.schlid1+"'and s.grade_id='"+req.query.gradeid+"' and s.academic_year='"+req.query.academic_year+"' and g.academic_year='"+req.query.academic_year+"' and a.academic_year='AY-"+req.query.academic_year+"' and s.flag='active' and a.flag='1' order by student_name";

console.log("-------Report---------");
  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});
app.post('/selectallsection1-service',  urlencodedParser,function (req,res)
{
  var qur1="select s.id,s.student_name,g.grade_name,a.admission_status,(select UPPER(section_id) from mp_grade_section ss where ss.grade_id='"+req.query.gradeid+"' and ss.class_id=s.class_id) as section from md_student s join md_school_grade_mapping g on (s.grade_id=g.grade_id) join md_admission a on (s.id=a.admission_no) where s.school_id='"+req.query.schlid1+"' and a.school_id='"+req.query.schlid1+"' and g.school_id='"+req.query.schlid1+"'and s.grade_id='"+req.query.gradeid+"' and s.academic_year='"+req.query.academic_year+"' and g.academic_year='"+req.query.academic_year+"' and s.class_id='"+req.query.classname+"' and s.flag='active' and a.flag='1' order by student_name";

  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});

app.post('/Fnselectspecific-service',  urlencodedParser,function (req,res)
{
    var qur1="SELECT * from md_admission where admission_no='"+req.query.admissionnum+"'  and school_id='"+req.query.schl1+"' and academic_year='"+req.query.academic_year+"' and flag='1'  AND active_status='Admitted'";  

  connection.query(qur1,
    function(err, rows)
    {
      if(!err)
      {
        if(rows.length>0)
        {
          res.status(200).json({'returnval': rows});
        } 
      else 
      {
          console.log(err);
          res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
        console.log(err);
    }
    });
});



app.post('/fnsubmitsection-service' , urlencodedParser,function (req, res)
{  

   var qurr1={ 
      school_id:req.query.scholid1,
      id:req.query.id,
      student_name:req.query.student_name,
      class_id:req.query.class_id,
      dob:req.query.dob,
      school_type:req.query.school_type,
      gender:req.query.gender,
      grade_id:req.query.grade_id,
      academic_year:req.query.academic_year,
      flag:'active'
     
      }; 
  // console.log(JSON.stringify(qurr1));
   var qur= "SELECT * FROM  md_student WHERE school_id='"+req.query.scholid1+"' and id='"+req.query.id+"' and student_name='"+req.query.student_name+"' and  academic_year='"+req.query.academic_year+"' and flag='active'";
   
    var qur11="update md_student set class_id='"+req.query.class_id+"',grade_id='"+req.query.grade_id+"',school_type='"+req.query.school_type+"' where school_id='"+req.query.scholid1+"' and id='"+req.query.id+"' and  academic_year='"+req.query.academic_year+"' and flag='active'";


      console.log("------------Student Section------------");
   console.log(qur);
   console.log('------------------------------------------');
   console.log(qur11)
   connection.query(qur,
    function(err, rows)
    {
      console.log(rows.length);
     if(rows.length==0){
     
     connection.query("INSERT INTO md_student SET ?",[qurr1],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur11,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });   
        } 
      });   
});


app.post('/previoussection-service',  urlencodedParser,function (req,res)
  {
     
     var qur="SELECT * from md_student where id='"+req.query.admission_no+"'  and school_id='"+req.query.scholid1+"' and grade_id='"+req.query.grade_id+"'and school_type='"+req.query.school_type+"' and academic_year='"+req.query.academic_year+"' and flag='active'";  

 /* var qur="SELECT student_name,gender,dob,class_id from md_student where id='"+req.query.admission_no+"'  and school_id='"+req.query.scholid1+"' and grade_id='"+req.query.grade_id+"'and school_type='"+req.query.school_type+"' and academic_year='"+req.query.academic_year+"' and flag='active'";*/

  console.log("--------------pre student-----------------");
  console.log(qur);
  console.log('*************************************');
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
        // console.log(JSON.stringify(rows));  
       if(rows.length>0) 
       {
          console.log(rows);
          res.status(200).json({'returnval': rows});
       }
       else
       {
          res.status(200).json({'returnval': 'empty'});
       }
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchenrichmentstudcategorysubjectwise-service',  urlencodedParser,function (req,res)
  {
  var qur="select distinct(subject_name) as subject_name from tr_beginner_assesment_marks where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  "section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"'";
  var totqur="select count(distinct(student_id)) as score,level,grade,subject_name from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' group by level,grade,subject_name";  
  var newqur="select count(distinct(student_id)) as score,level,grade,subject_name from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' and student_id not in(select id from md_student where "+
  " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.adacademicyear+"' and flag='active') group by level,grade,subject_name";
  var promotedqur="select count(distinct(student_id)) as score,level,grade,subject_name from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' and student_id in(select id from md_student where "+
  " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.adacademicyear+"' and flag='active') group by level,grade,subject_name";
  var comp1qur="select count(distinct(student_id)) as score,level,grade,subject_name,academic_year from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' and student_id in(select id from md_student where "+
  " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.adacademicyear+"' and flag='active') group by level,grade,subject_name,academic_year";
  var comp2qur="select count(distinct(student_id)) as score,level,grade,subject_name,academic_year from "+
  " tr_beginner_assesment_marks  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.adacademicyear+"' and "+
  " assesment_type in('EOY') and student_id in(select distinct(student_id) from "+
  " tr_beginner_assesment_marks  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and grade_id='"+req.query.grade+"' and  section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"') group by level,grade,subject_name,academic_year";
  var tot=[];
  var neww=[];
  var promote=[];
  var subject=[]; 
  var comp1=[];
  var comp2=[];
  console.log(qur);
  console.log(totqur);
  console.log(newqur);
  console.log(promotedqur);
  console.log(comp1qur);
  console.log(comp2qur);
  connection.query(qur,function(err, rows)
  {
  if(!err){
    subject=rows;
  connection.query(totqur,function(err, rows)
    {
      if(!err)
      {
        if(rows.length>0)
        { 
        tot=rows;  
        connection.query(newqur,function(err, rows)
        {   
        if(!err)
        {
        neww=rows;   
        connection.query(promotedqur,function(err, rows)
        { 
          if(!err){
          promote=rows;
          connection.query(comp1qur,function(err, rows)
          { 
          if(!err){
          comp1=rows;
          connection.query(comp2qur,function(err, rows)
          { 
          if(!err){
          comp2=rows;
          res.status(200).json({'subject':subject,'total': tot,'newtotal':neww,'promotedtotal':promote,'comp1':comp1,'comp2':comp2});
          }
          else
            console.log(err);
          });
          }
          else
            console.log(err);
          });
          }
          else
            console.log(err);
        });
        }
        else
            console.log(err);
        });
        } 
      else 
      {
          console.log(err);
          res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
        console.log(err);
    }
    });
  }
  });
});

app.post('/fetchenrichmentcategorylevel-service',  urlencodedParser,function (req,res)
  {
  var qur="select distinct(category) from enrichment_detail_grade_master where assesment_type='"+req.query.assesment+"' ";
  var totqur="select count(distinct(student_id)) as score,level,grade,enrich_level from tr_beginner_assesment_marks "+
  " where subject_name='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' group by level,grade,enrich_level";  
  var tot=[];
  var grade=[];
  console.log(qur);
  console.log(totqur);
  connection.query(qur,function(err, rows)
  {
  if(!err){
  grade=rows;
  connection.query(totqur,function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
      { 
      tot=rows;          
      res.status(200).json({'marks':tot,'grade':grade});
      }
      else 
      {
      console.log(err);
      res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
      console.log(err);
    }
    });
  }
  });
});

app.post('/fetchenrichmentcategorylevel1-service',  urlencodedParser,function (req,res)
  {
  var qur="select distinct(category) from enrichment_detail_grade_master where assesment_type='"+req.query.assesment+"' ";
  var speedqur="select count(distinct(student_id)) as score,level,grade,speed_level from tr_beginner_assesment_marks "+
  " where subject_name='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' group by level,grade,speed_level";  
  var comprehensionqur="select count(distinct(student_id)) as score,level,grade,comprehension_level from tr_beginner_assesment_marks "+
  " where subject_name='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' group by level,grade,comprehension_level";  
  var speed=[];
  var comprehension=[];
  var grade=[];
  console.log(qur);
  console.log(speedqur);
  console.log(comprehensionqur);
  connection.query(qur,function(err, rows)
  {
  if(!err){
  grade=rows;
  connection.query(speedqur,function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
      { 
      speed=rows; 
    connection.query(comprehensionqur,function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
      { 
      comprehension=rows;         
      res.status(200).json({'speed':speed,'grade':grade,'comprehension':comprehension});
      }
    }
    });
      }
      else 
      {
      console.log(err);
      res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
      console.log(err);
    }
    });
  }
  });
});

app.post('/fetchenrichmentcategoryleveldownload-service',  urlencodedParser,function (req,res)
  {
  var qur="select distinct(category) from enrichment_detail_grade_master where assesment_type='"+req.query.assesment+"' ";
  var totqur="select count(distinct(student_id)) as score,level,grade,enrich_level from tr_beginner_assesment_marks "+
  " where subject_name='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and assesment_type='"+req.query.assesment+"' group by level,grade,enrich_level";  
  var tot=[];
  var grade=[];
  console.log(qur);
  console.log(totqur);
  connection.query(qur,function(err, rows)
  {
  if(!err){
  grade=rows;
  connection.query(totqur,function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
      { 
      tot=rows;          
      res.status(200).json({'marks':tot,'grade':grade});
      }
      else 
      {
      console.log(err);
      res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
      console.log(err);
    }
    });
  }
  });
});


app.post('/enrichmentexcel-service',  urlencodedParser,function (req,res)
  {
  var qur="select *,(select id from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.adacademicyear+"' and flag='active' and "+
  " id=student_id) as status from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and grade_id='"+req.query.grade+"' and section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' order by student_name";  
  console.log('--------------------------');
  console.log(qur);
  console.log('--------------------------');
  connection.query(qur,
    function(err, rows)
    {
      if(!err)
      {
        if(rows.length>0)
        {
          
          res.status(200).json({'returnval': rows});
        } 
      else 
      {
          console.log(err);
          res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
        console.log(err);
    }
    });
});


app.post('/fnupdatesectionzzz-service' ,  urlencodedParser,function (req, res)
{  
  

    var qur="UPDATE  md_section SET section_name='"+req.query.sectionname+"',section_id='"+req.query.sectionid+"' where section_name='"+req.query.oldsection+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'";
    console.log("-------Section creation11------------");
    console.log(qur);

    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
    //  console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});







app.post('/gradesectioneditzzzz-service',  urlencodedParser,function (req,res)
{
    var qur1="SELECT * from md_class_section where school_id='"+req.query.schid+"' and class='"+req.query.setgrade+"' and academic_year='"+req.query.academic_year+"'";  

    console.log("---------------section list-------------");
    console.log(qur1);
  connection.query(qur1,
    function(err, rows)
    {
      if(!err)
      {
        if(rows.length>0)
        {
          res.status(200).json({'returnval': rows});
        } 
      else 
      {
          console.log(err);
          res.status(200).json({'returnval': 'no rows'});
      }
    } 
    else 
    {
        console.log(err);
    }
    });
});



app.post('/bookrefsection-service',  urlencodedParser,function (req,res)
  {  
    var qur1="select subject_id as subjectid,subject_name as subjectname from md_subject";
    var qur2="SELECT * FROM md_class_section where  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and class='"+req.query.gradename+"'";
    console.log(qur1);
    console.log(qur2);
    var subjectarr=[];
    var sectionarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    subjectarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    sectionarr=rows;
    res.status(200).json({'subjectarr': subjectarr,'sectionarr':sectionarr});
    }
    });
    }
    else
     res.status(200).json({'':'no rows'}); 
  });
});


app.post('/getcaptervalue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_chapter where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and gradeid='"+req.query.grade_id+"' and subjectid='"+req.query.subject_id+"'and term_id='"+req.query.termid+"'";
    
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});  
app.post('/bookrefsectioncapter-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_chapter SET ?";
    var response={ 
      school_id:req.query.school_id,
      gradeid:req.query.gradeid,
      subjectid:req.query.subjectid,
      academic_year:req.query.academic_year,
      capter:req.query.capter,
      capter_id:req.query.capter_id,
      period:req.query.period,
      buffer_period:req.query.buffer_period,
      term_id:req.query.termid,
    };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.capter_id).substring(2))+1;
      connection.query("UPDATE sequence SET chapter_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});



app.post('/fnsubconceptvalue-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_sub_concept SET ?";
    var response={ 

        
     sub_concept_id:req.query.subid,
     sub_concept_name:req.query.SubConcept,
      capter_id:req.query.setcptid,
      concept_id:req.query.setconid,
  
    };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.subid).substring(4))+1;
      connection.query("UPDATE sequence SET subconcept_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchsubjectseq-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fngetconceptvalue-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"'";
      var qur2="SELECT * FROM md_chapter where capter_id='"+req.query.capter_id+"'";
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var chapterarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    chapterarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'chapterarr':chapterarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});



/*
app.post('/fnsendconcept-service' ,  urlencodedParser,function (req, res)
{  
    var response={ 
       concept_id:req.query.concept_id,
       concept:req.query.concept,
       capter_id:req.query.capter_id,
       flag:req.query.flag, 
      }; 
     var qqq="SELECT * FROM md_concept WHERE concept_id='"+req.query.concept_id+"' and concept='"+req.query.concept+"'";
 
     console.log(qqq);
    console.log(response);

    connection.query(qqq,
    function(err, rows)
    {
    if(rows.length==0) 
    {
        connection.query("INSERT INTO md_concept SET ?",[response],
          function(err, rows)
          {
            if(!err)
            {
              var tempseq1=parseInt((req.query.concept_id).substring(3))+1;
                connection.query("UPDATE sequence SET concept_sequence='"+tempseq1+"'", function (err,result)
                      {
                        if(result.affectedRows>0)
                        res.status(200).json({'returnval': 'Inserted'});
                      });
            }
              else
              {
              console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
              }
            });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
  });
}); */  


app.post('/fnsendconcept-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_concept SET ?";
    var response={ 
      concept_id:req.query.concept_id,
       concept:req.query.concept,
       capter_id:req.query.capter_id,
       flag:req.query.flag
    };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.concept_id).substring(3))+1;
      connection.query("UPDATE sequence SET concept_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
}); 


app.post('/fnbookupdatevalue-service',  urlencodedParser,function (req, res)
{ 
     
    var qur="update md_concept set  concept='"+req.query.concept+"' where capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";

    console.log("----------- concept edit-------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});


  app.post('/fnschoolgradeset-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
    // console.log(e);
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/fnchapterupdatezzz-service',  urlencodedParser,function (req, res)
{  
 
  var qur="update md_chapter set  capter='"+req.query.chaptername+"' where capter_id='"+req.query.chapterid+"' and school_id='"+req.query.school_id+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"'";

   console.log("------------------------------------------------------");
    console.log(qur);
    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/buffset-service' ,urlencodedParser, function (req, res)
    {  
     var qur3="SELECT * FROM md_chapter  where capter_id='"+req.query.capter_id+"' and school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academic_year+"' and subjectid='"+req.query.subjectid+"' and gradeid='"+req.query.gradeid+"' and term_id='"+req.query.termid+"'";

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
  
  app.post('/buffset1-service',  urlencodedParser,function (req, res)
{  
   
  var qur="update md_chapter set  buffer_period='"+req.query.bufperiod+"' where capter_id='"+req.query.capter_id+"'";
console.log("=======================");
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchconcept-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM md_chapter where capter_id='"+req.query.chapterid+"'and subjectid='"+req.query.subjectid+"' and gradeid='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"'";

       var qur2="SELECT * FROM md_curriculum_display where chapter_id='"+req.query.chapterid+"'and subject_id='"+req.query.subjectid+"' and grade_id='"+req.query.gradeid+"' and term_id='"+req.query.termid+"'  and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' order by sno";
      console.log(qur1);
      console.log(qur2);
     var chapterarr=[];
     var dbarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    chapterarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    dbarr=rows;
    res.status(200).json({'chapterarr': chapterarr,'dbarr':dbarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/bookapprvvalsubject-service',urlencodedParser,function (req,res)
{  
   var qur1="select   distinct subject_id as subjectid,(select subject_name from md_subject where subject_id=subjectid) as subjectname from mp_teacher_grade where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'  and class_id='"+req.query.section+"'";

  console.log(qur1);

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/fnmasterplaninsert-service' , urlencodedParser,function (req, res)
{  
    var response={ 
      school_id: req.query.schoolid,
      academic_year: req.query.academicyear,
      grade_id: req.query.gradeid,
      grade_name: req.query.gradename,
      subject_id: req.query.subjectid,
      subject_name: req.query.subjectname,
      chapter_id: req.query.chapterid,
      chapter_name: req.query.chaptername,
      row_id: req.query.rowid,
      concept_id: req.query.conceptid,
      concept_name: req.query.conceptname,
      sub_concept_id: req.query.subconceptid,
      sub_concept_name: req.query.subconceptname,
      period: req.query.period,
      planned_date_from: req.query.plannedfromdate,
      planned_to_date: req.query.plannedtodate,
      skill: req.query.skill,
      value: req.query.value,
      innovation: req.query.innovation,
      teaching_aid:req.query.teachingaid,
      remarks: req.query.remarks,
      term_id:req.query.termid,
      bld_value_name:req.query.bldvalue, 
      sno:req.query.sno,
      skillid:req.query.skillid,
      valueid:req.query.valueid,
      bldvalueid:req.query.bldvalueid,
    };
    console.log('Coming for master insertion....');
    connection.query("INSERT INTO md_curriculum_planning SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});



app.post('/fnmasterplandisplyinsert-service' , urlencodedParser,function (req, res)
{  
    var response={ 
      school_id: req.query.schoolid,
      academic_year: req.query.academicyear,
      grade_id: req.query.gradeid,
      grade_name: req.query.gradename,
      subject_id: req.query.subjectid,
      subject_name: req.query.subjectname,
      chapter_id: req.query.chapterid,
      chapter_name: req.query.chaptername,
      row_id: req.query.rowid,
      concept_id: req.query.conceptid,
      concept_name: req.query.conceptname,
      sub_concept_id: req.query.subconceptid,
      sub_concept_name: req.query.subconceptname,
      period: req.query.period,
      planned_date_from: req.query.plannedfromdate,
      planned_to_date: req.query.plannedtodate,
      skill: req.query.skill,
      value: req.query.value,
      innovation: req.query.innovation,
      teaching_aid:req.query.teachingaid,
      remarks: req.query.remarks,
      term_id:req.query.termid,
      bld_value_name:req.query.bldvalue, 
      sno:req.query.sno,
      skillid:req.query.skillid,
      valueid:req.query.valueid,
      bldvalueid:req.query.bldvalueid,
    };
    console.log('Coming for Display insertion....');
    connection.query("INSERT INTO md_curriculum_display SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});


 app.post('/deletecuriculam-service' ,  urlencodedParser,function (req, res)
 {  

   var qur="delete from md_curriculum_planning where school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and chapter_id='"+req.query.chapterid+"' and row_id='"+req.query.rowid+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });



    app.post('/fnmasterplanedit-service' , urlencodedParser,function (req, res)
{  
    var response={ 
      school_id: req.query.schoolid,
      academic_year: req.query.academicyear,
      grade_id: req.query.gradeid,
      grade_name: req.query.gradename,
      subject_id: req.query.subjectid,
      subject_name: req.query.subjectname,
      chapter_id: req.query.chapterid,
      chapter_name: req.query.chaptername,
      row_id: req.query.rowid,
      concept_id: req.query.conceptid,
      concept_name: req.query.conceptname,
      sub_concept_id: req.query.subconceptid,
      sub_concept_name: req.query.subconceptname,
      period: req.query.period,
      planned_date_from: req.query.plannedfromdate,
      planned_to_date: req.query.plannedtodate,
      skill: req.query.skill,
      value: req.query.value,
      innovation: req.query.innovation,
      teaching_aid:req.query.teachingaid,
      remarks: req.query.remarks,
      term_id:req.query.termid,
      bld_value_name:req.query.bldvalue, 
      sno:req.query.sno,
      skillid:req.query.skillid,
      valueid:req.query.valueid,
      bldvalueid:req.query.bldvalueid,
    };
    console.log('Coming for master editing....');
       console.log(response);

    connection.query("INSERT INTO md_curriculum_planning SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      console.log(rows);
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});

app.post('/fnmasterplandisplyedit-service',  urlencodedParser,function (req, res)
{  

var qur="update md_curriculum_display set  concept_id='"+req.query.conceptid+"',concept_name='"+req.query.conceptname+"',sub_concept_id='"+req.query.subconceptid+"',sub_concept_name='"+req.query.subconceptname+"',bld_value_name='"+req.query.bldvalue+"',bldvalueid='"+req.query.bldvalueid+"',teaching_aid='"+req.query.teachingaid+"',planned_to_date='"+req.query.plannedtodate+"',planned_date_from='"+req.query.plannedfromdate+"',skillid='"+req.query.skillid+"',skill='"+req.query.skill+"',valueid='"+req.query.valueid+"',period='"+req.query.period+"',period='"+req.query.period+"',value='"+req.query.value+"',innovation='"+req.query.innovation+"',remarks='"+req.query.remarks+"' where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and row_id='"+req.query.rowid+"' and chapter_id='"+req.query.chapterid+"' and term_id='"+req.query.termid+"'  and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"'";
console.log('----------update---------------');
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fnsetcoskill-service' , urlencodedParser,function (req, res)
{  
    var response={ 
       concept_id:req.query.concept_id,
       capter_id:req.query.capter_id,
       planning_date:req.query.planned_date,
       school_id:req.query.school_id,
       academic_year:req.query.academic_year,
       period:req.query.period,
       innovation:req.query.innovation,
       remark:req.query.remark,
       flag:req.query.flag,
       rowid:req.query.rowid,
       subject_id:req.query.subjectid,
       grade_id:req.query.gradeid,
       conc_date:req.query.conc_date, 
       term_id:req.query.termid,
       planned_to_date:req.query.planned_to,
       teaching_aid:req.query.teachingaid,
       sno:req.query.sno,
    };
    console.log("----------------------------");
     console.log(response);
     console.log("----------------------------")
     connection.query("INSERT INTO md_skill SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      //console.log(rows);
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});
app.post('/fnsetbookvale-service' , urlencodedParser,function (req, res)
{  
    var response={ 
       capter_id:req.query.capter_id,
       planning_date:req.query.planned_date,
       school_id:req.query.school_id,
       academic_year:req.query.academic_year,
       period:req.query.period,
       flag:req.query.flag,
       rowid:req.query.rowid,
       term_id:req.query.termid,
       subject_id:req.query.subjectid,
       grade_id:req.query.gradeid,
       conc_date:req.query.conc_date,
       value_id:req.query.value_id,
       value_name:req.query.value_name,
       sno:req.query.sno,
       
    };
    console.log("+++++++++++++++++++++++++++++++");
     console.log(response);
     console.log("+++++++++++++++++++++++++++++++")
     connection.query("INSERT INTO md_book_value SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});
app.post('/fnsetcoskill11-service' , urlencodedParser,function (req, res)
{  
    var response={ 
       capter_id:req.query.capter_id,
       planning_date:req.query.planned_date,
       school_id:req.query.school_id,
       academic_year:req.query.academic_year,
       period:req.query.period,
       rowid:req.query.rowid,
       subject_id:req.query.subjectid,
       grade_id:req.query.gradeid,
       conc_date:req.query.conc_date,
       skill_id:req.query.skill_id,
       skill_name:req.query.skill_name,
       term_id:req.query.termid,
       sno:req.query.sno,
    };
    console.log("+++++++++++++++++++++++++++++++");
     console.log(response);
     console.log("+++++++++++++++++++++++++++++++")
     connection.query("INSERT INTO md_book_skill SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});

app.post('/fnsetcoskill12-service' , urlencodedParser,function (req, res)
{  
    var response={ 
       capter_id:req.query.capter_id,
       planning_date:req.query.planned_date,
       school_id:req.query.school_id,
       academic_year:req.query.academic_year,
       period:req.query.period,
       rowid:req.query.rowid,
       subject_id:req.query.subjectid,
       grade_id:req.query.gradeid,
       conc_date:req.query.conc_date,
       sub_concept_id:req.query.sub_concept_id,
       sub_concept_name:req.query.sub_concept_name,
       term_id:req.query.termid,
       sno:req.query.sno,
    };
    console.log("+++++++++++++++++++++++++++++++");
     console.log(response);
     console.log("+++++++++++++++++++++++++++++++")
     connection.query("INSERT INTO md_book_sub_concept SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});

app.post('/fnsetcoskill13-service' , urlencodedParser,function (req, res)
{  
    var response={ 
       capter_id:req.query.capter_id,
       planning_date:req.query.planned_date,
       school_id:req.query.school_id,
       academic_year:req.query.academic_year,
       period:req.query.period,
       rowid:req.query.rowid,
       subject_id:req.query.subjectid,
       grade_id:req.query.gradeid,
       conc_date:req.query.conc_date,
       bld_value_id:req.query.bld_value_id,
       bld_value_name:req.query.bld_value_name,
       term_id:req.query.termid,
       sno:req.query.sno,
    };
    console.log("+++++++++++++++++++++++++++++++");
     console.log(response);
     console.log("+++++++++++++++++++++++++++++++")
     connection.query("INSERT INTO md_book_bldvalue SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval':'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});


app.post('/fnbookeditskill-service',  urlencodedParser,function (req, res)
{  

var qur="update md_skill set planning_date='"+req.query.planned_date+"',teaching_aid='"+req.query.teachingaid+"',innovation='"+req.query.innovation+"',remark='"+req.query.remark+"',period='"+req.query.period+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and rowid='"+req.query.rowidz+"' and capter_id='"+req.query.capter_id+"' and term_id='"+req.query.termid+"'";
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



app.post('/fngetconceptvalue11-service',  urlencodedParser,function (req,res)
  {  
   var qur1="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"'";
      var qur2="SELECT * FROM md_curriculum_display where  chapter_id='"+req.query.capter_id+"' and row_id='"+req.query.rowid+"'and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and  term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"' and  subject_id='"+req.query.subjectid+"' ";
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var skillarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    skillarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'skillarr':skillarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


app.post('/fngetconceptvalue111-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM master_value";
      var qur2="SELECT * FROM md_curriculum_display where  chapter_id='"+req.query.capter_id+"' and row_id='"+req.query.rowid+"'and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and  term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"'";
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var skillarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    skillarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'skillarr':skillarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fngetbldvalues-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM md_bldvalue";
       var qur2="SELECT * FROM md_curriculum_display where  chapter_id='"+req.query.capter_id+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and row_id='"+req.query.rowid+"' and  term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"'";
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var skillarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    skillarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'skillarr':skillarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});



app.post('/fngetskills-service',  urlencodedParser,function (req,res)
  {  
        var qur1="SELECT * FROM master_skill";
       var qur2="SELECT * FROM md_curriculum_display where  chapter_id='"+req.query.capter_id+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and row_id='"+req.query.rowid+"'and   term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"'";
      console.log("---------------------------------");
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var skillarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  

    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
   if(rows.length>0){
      skillarr=rows;

   }
   else{
      skillarr="";
   
     }
    res.status(200).json({'conceptarr': conceptarr,'skillarr':skillarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


/*app.post('/buffset-service' ,urlencodedParser, function (req, res)
    {  
     var qur3="SELECT * FROM md_chapter  where capter_id='"+req.query.capter_id+"'";

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });*/



app.post('/fngetsubconcepts-service',  urlencodedParser,function (req,res)
  {  
     var qur1="SELECT s.sub_concept_id,s.sub_concept_name,r.concept_id,r.concept FROM md_sub_concept s JOIN md_concept r  ON(r.concept_id=s.concept_id) where r.capter_id='"+req.query.capter_id+"' and r.concept_id='"+req.query.conceptid+"'";

      var qur2="SELECT * FROM md_curriculum_display where  chapter_id='"+req.query.capter_id+"' and row_id='"+req.query.rowid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and  term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"'";
  
     var qur3="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.conceptid+"'";
console.log("-----------------Fecthing subconcepts-----------------");
    console.log(qur1);
    console.log("------------------------------------------------------");
 console.log(qur2);
   console.log("------------------------------------------------------");

    var conceptarr=[];
    var skillarr=[];
    var dbarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;

     connection.query(qur2,function(err, rows){
    if(!err)
    {  
    skillarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  

    dbarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'skillarr':skillarr,'dbarr':dbarr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


/*app.post('/fngetsubconcepts-service' ,urlencodedParser, function (req, res)
    {  
    var qur3="SELECT * FROM md_sub_concept where capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.conceptid+"'";
    

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
app.post('/fngetsubconcepts1-service' ,urlencodedParser, function (req, res)
    {  
     var qur3="SELECT * FROM md_book_sub_concept where  capter_id='"+req.query.capter_id+"' and  planning_date='"+req.query.planneddate+"' and period='"+req.query.period+"'";
    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });*/

app.post('/buffdel-service',  urlencodedParser,function (req, res)
{  
   
   var qur="update md_chapter set  period='"+req.query.delperiod+"' where capter_id='"+req.query.capter_id+"'";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchclassconcept11-service',  urlencodedParser,function (req,res)
  {
   var qur1="select  section_id,emp_id as empid,(select distinct emp_name from md_employee_creation where emp_id=empid and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' ) as empname,chapter_id,chapter_name,concept_id,concept_name,sub_concept_id,sub_concept_name,period,planned_date_from,planned_to_date,skill,value,innovation,lr_rectification,remarks,correction_status,completion_status,created_date,row_id ,term_id ,enrichment_sug,bld_value_name,teaching_aid,co_ordinator_remarks from md_curriculum_planning_approval where grade_id='"+req.query.gradeid+"' and  subject_id='"+req.query.subjectid+"' and  section_id='"+req.query.sectoinidz+"' and chapter_id='"+req.query.chapterid+"'  and academic_year='"+req.query.academic_year+"' and school_id='"+req.query.schoolid+"' and completion_status='no' and term_id='"+req.query.termid+"'";
      console.log("---------------");
      console.log(qur1);
     console.log("---------------");
     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/chapterstatus-service',  urlencodedParser,function (req, res)
{

 // var qur="select distinct(f.chapter_id),f.grade_id,g.grade_name,f.subject_id,s.subject_name,f.section_id,gs.section_id as section_name,ch.capter,e.emp_name,f.emp_id from  md_curriculum_planning_approval f  join md_grade g on(g.grade_id=f.grade_id) join md_subject s on(s.subject_id=f.subject_id) join mp_grade_section gs on(gs.class_id=f.section_id) join md_chapter ch on(ch.capter_id=f.chapter_id) join   md_employee_creation e on(e.emp_id=f.emp_id) where f.school_id='"+req.query.schoolid+"' and f.completion_status='No' and gs.school_id='"+req.query.schoolid+"' and gs.grade_id=f.grade_id and gs.academic_year='"+req.query.academicyear+"'and f.academic_year='"+req.query.academicyear+"' and ch.school_id='"+req.query.schoolid+"' and ch.academic_year='"+req.query.academicyear+"' and  e.school_id='"+req.query.schoolid+"' and e.academic_year='"+req.query.academicyear+"'"; 
 var qur="select distinct chapter_id,chapter_name,grade_id,grade_name,subject_id,subject_name,emp_id,emp_name,term_id,section_id,section_name from md_curriculum_planning_approval where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
 " and completion_status='No' and grade_id in (select distinct(grade_id) from mp_teacher_grade where school_id='"+req.query.schoolid+"' "+
 " and academic_year='"+req.query.academicyear+"' and id='"+req.query.empid+"' and role_id='co-ordinator')";
  console.log('-------------------Chapter completion----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/getappovedcoordinator-service',  urlencodedParser,function (req,res)
{  
   var qur="select distinct grade_id as gradeid ,(select grade_name from  md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and role_id='"+req.query.roleid+"'";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});



app.post('/masterbookz-service',urlencodedParser,function (req,res)
{  
  var qur1="select * from master_value";
  console.log(qur1);

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});



app.post('/fnbookplangrade-service',  urlencodedParser,function (req,res)
  {  
      var qur1="select distinct grade_id as gradeid,(select distinct grade_name from md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and  role_id='"+req.query.roleid+"' and school_id='"+req.query.schoolid+"'";

 
     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/fnbookplansubject-service',  urlencodedParser,function (req, res)
{
    
  connection.query('SELECT * from md_subject',
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/fetchchapter-service',  urlencodedParser,function (req,res)
{ 
  var qur2=" select * from md_chapter where school_id='"+req.query.schoolid+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"'";

  console.log(qur2);

   connection.query(qur2,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});

app.post('/fngetclassbooksectionvalue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT distinct class_id,section_id FROM mp_teacher_grade  where grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.empid+"' and role_id='subject-teacher'";
    console.log("-------");
    console.log(qur);
    connection.query(qur,function(err, rows){
    if(!err)
    {  
      console.log(rows);
    res.status(200).json({'sectionarr':rows});
    }
    });
  });

app.post('/fngetclassbooksubjectvalue-service',  urlencodedParser,function (req,res)
  {     
    var qur="SELECT distinct(subject_id),(select subject_name from md_subject where subject_id=g.subject_id) as subject_name FROM mp_teacher_grade g where section_id='"+req.query.sectionid+"' and grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.empid+"' and role_id='subject-teacher'";
    console.log('---------calling subject--------------');
    console.log(qur);
    var conceptarr=[];
    var sectionarr=[];
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    res.status(200).json({'subjectarr': rows});
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fngetclassbookchaptervalue-service',  urlencodedParser,function (req,res)
  {     

    
    var qur="SELECT distinct(chapter_id),chapter_name  FROM `md_curriculum_planning` WHERE school_id='"+req.query.schoolid+"' and term_id='"+req.query.termid+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and academic_year='"+req.query.academicyear+"'";


    /*var qur="SELECT distinct(capter_id),(select capter from md_chapter c where c.capter_id=s.capter_id and "+
    " c.school_id='"+req.query.schoolid+"' and c.academic_year='"+req.query.academicyear+"' and c.gradeid='"+req.query.gradeid+"' and  c.term_id='"+req.query.termid+"' and c.subjectid='"+req.query.subjectid+"') as capter "+
    " FROM md_skill s join mp_teacher_grade g on(g.grade_id=s.grade_id) WHERE "+
    " g.school_id='"+req.query.schoolid+"' and s.school_id='"+req.query.schoolid+"' and g.academic_year='"+req.query.academicyear+"' "+
    " and s.academic_year='"+req.query.academicyear+"' and g.subject_id='"+req.query.subjectid+"' "+
    " and s.subject_id='"+req.query.subjectid+"' and g.grade_id='"+req.query.gradeid+"' and s.grade_id='"+req.query.gradeid+"' and s.term_id='"+req.query.termid+"'";*/
    console.log('---------------------------------------------------');
    console.log(qur);
    console.log('---------------------------------------------------');
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    res.status(200).json({'chapterarr': rows});
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fngetclassbookchapterconcept-service',  urlencodedParser,function (req,res)
  {     
    var qur="SELECT * FROM md_curriculum_planning WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and chapter_id='"+req.query.chapterid+"' and term_id='"+req.query.termid+"'";
    console.log('--------------------chapter concept-------------------------------');
    console.log(qur);
    console.log('---------------------------------------------------');
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    res.status(200).json({'chapterarr': rows});
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});
app.post('/fetchalreadyapprovedchapterconcept-service',  urlencodedParser,function (req,res)
  {     
           
    var qur="SELECT * FROM md_curriculum_planning_approval WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and emp_id='"+req.query.empid+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and subject_id='"+req.query.subjectid+"' and chapter_id='"+req.query.chapterid+"' and term_id='"+req.query.termid+"'";
    console.log('--------------------Already approved concepts-------------------------------');
    console.log(qur);
    console.log('---------------------------------------------------');
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    res.status(200).json({'approvedarr': rows});
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


app.post('/updateapprovalstatusofchapterconcept-service',  urlencodedParser,function (req,res)
  {     
    var response={ 
      school_id: req.query.schoolid,
      academic_year: req.query.academicyear,
      emp_id:req.query.empid,
      emp_name:req.query.empname,
      grade_id: req.query.gradeid,
      grade_name: req.query.gradename,
      section_id: req.query.sectionid,
      section_name: req.query.sectionname,
      subject_id: req.query.subjectid,
      subject_name: req.query.subjectname,
      chapter_id: req.query.chapterid,
      chapter_name: req.query.chaptername,
      row_id: req.query.rowid,
      concept_id: req.query.conceptid,
      concept_name: req.query.conceptname,
      sub_concept_id: req.query.subconceptid,
      sub_concept_name: req.query.subconceptname,
      period: req.query.period,
      planned_date_from: req.query.fromdate,
      planned_to_date: req.query.todate,
      skill: req.query.skill,
      value: req.query.value,
      innovation: req.query.innovation,
      lr_rectification: req.query.lrrectification,
      remarks: req.query.remarks,
      correction_status: req.query.correctionstatus, 
      completion_status: req.query.completionstatus ,
       enrichment_sug: req.query.enrichmentsuggest ,
       completion_date: req.query.completion_date,
       term_id:req.query.termid,
       bld_value_name:req.query.bldvalues,
       teaching_aid:req.query.teachingaid,
       co_ordinator_remarks:req.query.coremark
    };
    // var qurcheck="SELECT * FROM md_curriculum_planning_approval WHERE school_id='"+req.query.schoolid+"' "+
    // "and academic_year='"+req.query.academicyear+"' and emp_id";
    connection.query("INSERT INTO md_curriculum_planning_approval SET ?",[response],function(err, rows){
    if(!err)
    {  
    res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated'}); 
    }
    });
});
app.post('/bookvaldel-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="delete from md_book_value where value_id='"+req.query.valueid+"' and  capter_id='"+req.query.capterid+"' and concept_id='"+req.query.conceptid+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });

app.post('/fetchclassconcept-service',  urlencodedParser,function (req,res)
  {  
   var qur1="SELECT m.conc_date as conuid,s.conc_date as subuid,m.Correction,m.lrrectife,m.innovation, m.remark,m.period, s.planning_date,s.rowid, r.capter_id, s.sub_concept_id,s.sub_concept_name,r.concept_id  ,(select  concept from md_concept  where  concept_id=r.concept_id)  as conceptname FROM md_book_sub_concept s JOIN md_sub_concept r  ON(r.sub_concept_id =s.sub_concept_id)  join md_skill  m ON(r.concept_id =m.concept_id  ) and (s.planning_date=m.planning_date) and (s.rowid=m.rowid) where r.capter_id='"+req.query.chapterid+"' and s.conc_date  not in(select p.conc_date  from final_book_sug p where p.school_id='"+req.query.schoolid+"' and p.academic_year='"+req.query.academic_year+"' and p.subject_id='"+req.query.subjectid+"' and  p.section_id='"+req.query.sectoinid+"' and  p.grade_id='"+req.query.gradeid+"' and p.capter_id='"+req.query.chapterid+"')"; 

    var qur2="SELECT distinct id as empid,(select distinct emp_name from md_employee_creation where emp_id=empid and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"') as empname FROM mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and class_id='"+req.query.sectoinid+"'";

     var qur3="select * from  final_book_sug where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and section_id='"+req.query.sectoinid+"' and capter_id='"+req.query.chapterid+"'";

     var qur4="select * from  md_book_value  where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and capter_id='"+req.query.chapterid+"'";

     var qur5="select * from  md_book_skill  where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and capter_id='"+req.query.chapterid+"'";

    var qur6="select * from  final_book_value where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and section_id='"+req.query.sectoinid+"' and capter_id='"+req.query.chapterid+"'";

    var qur7="select * from  final_book_skill where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and section_id='"+req.query.sectoinid+"' and capter_id='"+req.query.chapterid+"'";

     var conceptarr=[];
     var emparr=[];
     var dbarr=[];
     var valuearr=[];
     var subarr=[];
     var skillarr=[];
     var dbskillarr=[];
     var dbvaluearr=[];

   console.log("===============");
   console.log(qur1);
   console.log(qur2);
   console.log(qur3);
   console.log(qur4);
   console.log(qur5);
   console.log(qur6);
   console.log(qur7);
  
 
   console.log("===============");
     

   connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
   connection.query(qur4,function(err, rows){
    if(!err)
    {  
    valuearr=rows;
    connection.query(qur6,function(err, rows){
    if(!err)
    {  
    dbvaluearr=rows;
     connection.query(qur7,function(err, rows){
    if(!err)
    {  
    dbskillarr=rows;
     connection.query(qur2,function(err, rows){
    if(!err)
    {  
    emparr=rows;
    
    connection.query(qur5,function(err, rows){
    if(!err)
    {  
    skillarr=rows;
   connection.query(qur3,function(err, rows){
    if(!err)
    { 
    dbarr=rows;
      res.status(200).json({'conceptarr': conceptarr,'emparr':emparr,'dbarr':dbarr,'valuearr':valuearr,'skillarr':skillarr,'dbskillarr':dbskillarr,'dbvaluearr':dbvaluearr});
    }
    });
    }
    });
    }
    });
    }
     });
    }
     });
    }
     });
    }
   
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


/*app.post('/fnsetz1-service' ,urlencodedParser, function (req, res)
    {  
   var qur3="SELECT * FROM md_book_value  where capter_id='"+req.query.chapterid+"' and  concept_id not in(select s.concept_id  from final_book_sug s where s.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academic_year+"' and s.subject_id='"+req.query.subjectid+"' and  s.section_id='"+req.query.sectoinid+"' and  s.grade_id='"+req.query.gradeid+"' and s.capter_id='"+req.query.chapterid+"')";

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });

  */

   app.post('/fnfinalbook-service',  urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academic_year,
         capter_id:req.query.chapterid,
         subject_id:req.query.subjectid,
         grade_id:req.query.gradeid,
         completion_date:req.query.completion_date,
         completion:req.query.status,   
         section_id:req.query.sectionid,   
         emp_id:req.query.empid,   
         innovation:req.query.innovation,   
         enrichment_sug:req.query.enrichmentsuggest, 
         planning_date:req.query.planneddate,   
         period:req.query.period,   
         concept:req.query.concept,   
         remark:req.query.remark,   
         concept_id:req.query.conceptid,
         conc_date:req.query.subuid,
         Correction:req.query.Correction,
         lrrectife:req.query.lrrectife, 
         rowid:req.query.rowidz,
         sub_concept_id:req.query.subconceptid,
         sub_concept_name:req.query.subconceptname,
       }

console.log("-------concept---------");
console.log(response);
console.log("----------------");

  connection.query("INSERT INTO final_book_sug set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
  app.post('/fnfinalbookskill-service',  urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academic_year,
         subject_id:req.query.subjectid,
         grade_id:req.query.gradeid,
         section_id:req.query.sectionid,   
         emp_id:req.query.empid,   
         skill_id:req.query.skillid,   
         skill_name:req.query.skillname,   
         planning_date:req.query.planneddate,   
         period:req.query.period,   
         conc_date:req.query.skiluid,
         rowid:req.query.rowidz,
         capter_id:req.query.chapterid,
         suid:req.query.subuid,

       }

console.log("-------SKill---------");
console.log(response);
console.log("----------------");

  connection.query("INSERT INTO final_book_skill set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
  app.post('/fnfinalbookvalue-service',  urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academic_year,
         subject_id:req.query.subjectid,
         grade_id:req.query.gradeid,
         capter_id:req.query.chapterid,
         section_id:req.query.sectionid,   
         emp_id:req.query.empid,   
         value_id:req.query.valueid,   
         value_name:req.query.valuename,   
         planning_date:req.query.planneddate,   
         period:req.query.period,   
         conc_date:req.query.valuuid,
         rowid:req.query.rowidz,
         suid:req.query.subuid,
       }
console.log("--------value--------");
console.log(response);
console.log("----------------");

  connection.query("INSERT INTO final_book_value set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fnfinalbook1-service',  urlencodedParser,function (req, res)
{  

var qur="update md_curriculum_planning_approval  set completion_date='"+req.query.completion_date+"',skill='"+req.query.skill+"',innovation='"+req.query.innovation+"',co_ordinator_remarks='"+req.query.coremark+"' ,period='"+req.query.period+"',enrichment_sug='"+req.query.enrichmentsug+"',completion_status='"+req.query.completion+"' where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and concept_id='"+req.query.conceptid+"' and chapter_id='"+req.query.chapterid+"'and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and  section_id='"+req.query.sectionid+"' and  sub_concept_id='"+req.query.subconceptid+"'and row_id='"+req.query.rowidz+"' and term_id='"+req.query.termid+"'";
console.log("****************");
console.log(qur);
console.log("****************");

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchnewformatremark-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM tr_term_attendance WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_id='"+req.query.termname+"'";
  console.log('----------------------------------------');
  console.log(qur);
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    res.status(200).json({'returnval': rows});
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/fetchnewformatremark-service1',  urlencodedParser,function (req,res)
{  
 var qur="SELECT * FROM tr_term_attendance WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_id='"+req.query.termname+"'";
  console.log('----------------------------------------');
  console.log(qur);
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    global.remarkss=rows;
    res.status(200).json({'returnval': rows});
  }
  else
    res.status(200).json({'returnval': ''});
  });
});
  

app.post('/fetchstudinfofornewformat-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_admission WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND admission_no='"+req.query.studentid+"' and flag='1'  AND active_status='Admitted'";

 var qur1 ="select UPPER(id) as id,UPPER(school_id) as school_id from  mp_teacher_grade where school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear1+"' and grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"')  and role_id='class-teacher'  and section_id='"+req.query.section+"' and flage='active'";


  console.log('-----------------5to8 and 9to10 studentinfo ---------------');
  console.log(qur1);
  console.log(qur);
  console.log("---------------------------------------");
  var emparr=[];
  connection.query(qur1,function(err, rows){
  if(!err)
  { 
    emparr=rows;
   connection.query(qur,function(err, rows){
  if(!err)
  { 
    global.studentpersonalinfo=rows;
    res.status(200).json({'returnval':rows,"emparr":emparr});
  }
  else
    res.status(200).json({'returnval': ''});
  });
   }
   });
});

app.post('/fetchnewformatscholasticsubjects-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT grade,term_name,subject_id,assesment_id,student_id,sum(mark) as total FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_name in(select term_name from md_term "+
  " where academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')) group by term_name,assesment_id,subject_id,student_id,grade order by term_name,subject_id";
  var scalequr="SELECT * FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name in(select term_name from md_term "+
  " where academic_year='"+req.query.academicyear+"' and id <=(select id from md_term where term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"'))";
  var subqur="SELECT distinct(subject_id) FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND term_name='"+req.query.termname+"' AND academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' order by subject_id";
  var gradequr="SELECT * FROM newformat_scholastic_grademaster";
  console.log('----------------------------------------');
  console.log(qur);
  console.log('----------------------------------------');
  console.log(scalequr);
  var assesment=[];
  var master=[];
  var subject=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    assesment=rows;
    global.assesmentarrs=rows;
    connection.query(scalequr,function(err, rows){
    if(!err)
    {
    master=rows;
      global.masterarrs=rows;
    connection.query(subqur,function(err, rows){
    if(!err)
    {
      global.subjectarrs=rows;
    subject=rows;
    connection.query(gradequr,function(err, rows){
    if(!err)
    {
      global.gradearrs=rows;
    res.status(200).json({'assesment': assesment,'master':master,'subject':subject,'grade':rows});
    }
    });
    }
    });
    }
    else
      console.log(err);
    });
  }
  else{
    console.log(err);
    res.status(200).json({'returnval': ''});
  }
  });
});

app.post('/fetchnewformatscholasticsubjects-service1',  urlencodedParser,function (req,res)
{ 
  var qur="SELECT grade,term_name,subject_id,assesment_id,student_id,sum(mark) as total FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_name in('"+req.query.termname+"') group by term_name,assesment_id,subject_id,student_id,grade order by term_name,subject_id";
  var scalequr="SELECT * FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.termname+"')";
  var subqur="SELECT distinct(subject_id) FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' order by subject_id";
  var gradequr="SELECT * FROM newformat_scholastic_grademaster";
  var scaleup="SELECT sum(actual_scale) as tot,subject_name,grade_name FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' group by subject_name,grade_name order by subject_id"
  console.log('--------------------fivetoten reportcard fetch--------------------');
  console.log(qur);
  console.log('----------------------------------------');
  console.log(scalequr);
  console.log('----------------------------------------');
  console.log(subqur);
  console.log('----------------------------------------');
  console.log(gradequr);
  console.log('----------------------------------------');
  console.log(scaleup);
  var assesment=[];
  var master=[];
  var subject=[];
  var grade=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
      global.assesmentarrs=rows;
    assesment=rows;
  
    connection.query(scalequr,function(err, rows){
    if(!err)
    {
    master=rows;
    global.masterarrs=rows;
    connection.query(subqur,function(err, rows){
    if(!err)
    {
      global.subjectarrs=rows;
    subject=rows;
    connection.query(gradequr,function(err, rows){
    if(!err)
    {
      global.gradearrs=rows;
    grade=rows;
    connection.query(scaleup,function(err, rows){
    if(!err)
    {
      global.scaleuparrs=rows;
    res.status(200).json({'assesment': assesment,'master':master,'subject':subject,'grade':grade,'scaleup':rows});
    }
    else
      console.log("err...lastin"+err);
    });
    }
    else
      console.log("err...last"+err);
    });
    }
    else
      console.log("err...last before"+err);
    });
    }
    else
      console.log(err);
    });
  }
  else{
    console.log(err);
    res.status(200).json({'returnval': ''});
  }
  });
});

app.post('/fetchnewformatscholasticsubjects-service2',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade,term_name,subject_id,assesment_id,student_id,sum(mark) as total FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_name in(select term_name from md_term "+
  // " where id <=(select id from md_term where term='"+req.query.termname+"')) group by term_name,assesment_id,subject_id,student_id,grade order by term_name,subject_id";
  var createqur="INSERT INTO tr_fa_overall SELECT grade,(select distinct(type) from subject_mapping where assesment_type=assesment_id) as type,category,subject_id,student_id, "+
  " MAX(CAST(mark as DECIMAL(9,2))) as total FROM tr_term_fa_assesment_marks  WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' "+
  " AND student_id='"+req.query.studentid+"' group by subject_id,(select distinct(type) from subject_mapping where assesment_type=assesment_id), "+
  " category,student_id,grade order by subject_id";
  var qur="select grade,type as assesment_id,subject_id,student_id,sum(total) as total from tr_fa_overall group by grade,type,subject_id,student_id "+
  " order by subject_id";
  var scalequr="SELECT * FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.termname+"')";
  var subqur="SELECT distinct(subject_id) FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' order by subject_id";
  var gradequr="SELECT * FROM newformat_scholastic_grademaster";
  var scaleup="SELECT sum(actual_scale) as tot,subject_name,grade_name FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' group by subject_name,grade_name order by subject_id"
  var dropqur="DELETE FROM tr_fa_overall";
  console.log('--------------------fivetoten reportcard fetch--------------------');
  console.log(createqur);
  console.log(qur);
  console.log(dropqur);
  console.log('----------------------------------------');
  console.log(scalequr);
  console.log('----------------------------------------');
  console.log(subqur);
  console.log('----------------------------------------');
  console.log(gradequr);
  console.log('----------------------------------------');
  console.log(scaleup);
  var assesment=[];
  var master=[];
  var subject=[];
  var grade=[];
  var scaleupp=[];
  connection.query(createqur,function(err, rows){
  if(!err)
  { 
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    global.assesmentarrs=rows;
    assesment=rows;
  
    connection.query(scalequr,function(err, rows){
    if(!err)
    {
    master=rows;
    global.masterarrs=rows;
    connection.query(subqur,function(err, rows){
    if(!err)
    {
      global.subjectarrs=rows;
    subject=rows;
    connection.query(gradequr,function(err, rows){
    if(!err)
    {
      global.gradearrs=rows;
    grade=rows;
    connection.query(scaleup,function(err, rows){
    if(!err)
    {
      global.scaleuparrs=rows;
      scaleupp=rows;
    connection.query(dropqur,function(err, rows){
    if(!err)
    {
    res.status(200).json({'assesment': assesment,'master':master,'subject':subject,'grade':grade,'scaleup':scaleupp});
    }
    else{
      console.log('error in drop'+err);
    }
    });
    }
    else
      console.log("err...lastin scholastic"+err);
    });
    }
    else
      console.log("err...last"+err);
    });
    }
    else
      console.log("err...last before"+err);
    });
    }
    else
      console.log(err);
    });
  }
  else{
    console.log(err);
    res.status(200).json({'returnval': ''});
  }
  });
  }
  else{
   console.log('error in table creation...'+err); 
  }
  });
});

app.post('/fetchnewformatcoscholasticsubjects1-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT student_id,avg(mark) as total,subject_id FROM "+
  "tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  "AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' AND term_name='"+req.query.termname+"'"+
  "group by subject_id";
  var qur1="select * from md_coscholastic_grade_rating";
  console.log('----------------------------------------');
  console.log(qur);
  var cs=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    cs=rows;
    global.coarrsvalus=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {
      global.gradearrss=rows;
    res.status(200).json({'coarr': cs,'gradearr':rows});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/fetchnewformatcoscholasticsubjects2-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT student_id,mark as total,subject_id FROM "+
  // "tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  // "AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' AND term_name='"+req.query.termname+"'"+
  // "group by subject_id";
  var qur="SELECT '"+req.query.termname+"',student_id,MAX(CAST(mark as DECIMAL(9,2))) as total,subject_id FROM tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  " AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' group by '"+req.query.termname+"',subject_id";
  var qur1="select * from md_coscholastic_grade_rating";
  console.log('----------------------------------------');
  console.log(qur);
  var cs=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    cs=rows;
    global.coarrsvalus=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {
      global.gradearrss=rows;
    res.status(200).json({'coarr': cs,'gradearr':rows});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});



app.post('/fetchnewformatcoscholasticsubjects-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT student_id,avg(mark) as total,subject_id FROM "+
  "tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  "AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_name='"+req.query.termname+"' "+ 
  "group by subject_id order by term_name";
  var qur1="select * from md_coscholastic_grade_rating";
  console.log('----------------------------------------');
  console.log(qur);
  var cs=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    cs=rows;
    global.coarrsvalus=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {
      global.gradearrss=rows;
    res.status(200).json({'coarr': cs,'gradearr':rows});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/fetchdynamicallyenteredscholasticmarks-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_term_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name,category";
var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' group by subject_id,subject_name,category_id,category_name";
var mapqur="SELECT * FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and  academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' order by category_id";

 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log(categorycnt);
 console.log(mapqur);
 console.log('--------------------------------------------------------');
 var arr1=[];
 var arr2=[];
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
    function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
    connection.query(mapqur,
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


/*
app.post('/templateincoscolasticsubject-service',  urlencodedParser,function (req, res)
{

var qur;
if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
{
qur="select school_id,student_id as id,student_name,class_id from tr_student_to_subject where class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and subject_id='"+req.query.subjectid+"' and flag='active' and flag='active' order by student_name";
 }
else{
 qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' order by student_name";
}

var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' group by subject_id,subject_name,category_id,category_name";
var mapqur="SELECT * FROM subject_mapping WHERE  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' order by category_id";

 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log(categorycnt);
 console.log(mapqur);
 console.log('--------------------------------------------------------');
 var arr1=[];
 var arr2=[];
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
    function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
    connection.query(mapqur,
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
*/

app.post('/templateincoscolasticsubject-service',  urlencodedParser,function (req,res)
  {  
    var qur;
if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
{
qur="select school_id,student_id as id,student_name,class_id from tr_student_to_subject where class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and subject_id='"+req.query.subjectid+"' and flag='active' and flag='active' order by student_name";
 }
else{
 qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' order by student_name";
}


 
  var qur1="SELECT * FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' order by sub_category_id";

   var qur2="SELECT category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' group by category_id,category_name";

     var enricharr=[];
    var studentarr=[]; 
    var categorycnt=[];
    console.log("----------------sub-mapping------------");
    //console.log(qur1);
   // console.log(qur2)
    console.log(qur);
    console.log("----------------------------------------")
    connection.query(qur,function(err, rows){
    if(!err)
     {  
     studentarr=rows;
      connection.query(qur2,function(err, rows){
     if(!err)
     {  
     categorycnt=rows;
     connection.query(qur1,function(err, rows){
    if(!err)
    {  

    enricharr=rows;
    res.status(200).json({'enricharr': enricharr,'studentarr':studentarr,'categorycnt':categorycnt});
    }
    });
    }
     });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});





app.post('/templateincoscolasticsubject1-service',  urlencodedParser,function (req,res)
  {  
    var qur;
if(req.query.langpref=="Second Language"||req.query.langpref=="Third Language")
{
qur="select school_id,student_id as id,student_name,class_id from tr_student_to_subject where class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and subject_id='"+req.query.subjectid+"' and flag='active' and flag='active' order by student_name";
 }
else{
 qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' order by student_name";
}

 var qur1="SELECT * ,(SELECT count(sub_metrics) FROM md_coscholastic_metrics WHERE subject_id='"+req.query.subjectid+"'  and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and  grade_name='"+req.query.gradename+"' order by sub_category) as cmt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' order by sub_category_id";

   var qur2="SELECT * FROM md_coscholastic_metrics WHERE subject_id='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' order by sub_category";

   var qur3="SELECT count(sub_metrics)as cmt FROM md_coscholastic_metrics WHERE subject_id='"+req.query.subjectid+"'and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' order by sub_category";

  var qur4=" SELECT count(sub_category)as counvalue,sub_category,category_name FROM md_coscholastic_metrics WHERE subject_id='"+req.query.subjectid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' group by sub_category order by sub_category";

    var enricharr=[];
    var studentarr=[]; 
    var categorycnt=[];
    var cmtarr=[];
    var finalarr=[];
    console.log("----------------sub-mapping------------");
    console.log(qur1);
    console.log(qur2)
    console.log(qur);
    console.log("--------------------------");
    console.log(qur4);
    console.log("----------------------------------------")
    connection.query(qur,function(err, rows){
    if(!err)
     {  
     studentarr=rows;
   connection.query(qur2,function(err, rows){
     if(!err)
     {  
    categorycnt=rows;
   connection.query(qur3,function(err, rows){
      if(!err)
     {  
    cmtarr=rows;
      connection.query(qur4,function(err, rows){
      if(!err)
     {  
    finalarr=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    enricharr=rows;
    res.status(200).json({'enricharr': enricharr,'studentarr':studentarr,'categorycnt':categorycnt,"cmtarr":cmtarr,'finalarr':finalarr});
    }
    });
    }
     });
    }
    });
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


app.post('/fetchdynamicallyenteredscholasticmarks1-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and  term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name,sub_category";
var categorycnt="SELECT subject_id,subject_name,category_id,category_name,count(sub_category_id) as cnt FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' group by subject_id,subject_name,category_id,category_name";
var mapqur="SELECT * FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' order by category_id";

 console.log('--------------------------enrichment stud fetch for report------------------------------');
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log(categorycnt);
 console.log(mapqur);
 console.log('--------------------------------------------------------');
 var arr1=[];
 var arr2=[];
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      arr1=rows;
    connection.query(categorycnt,
    function(err, rows)
    {
    if(!err)
    { 
      arr2=rows;
    connection.query(mapqur,
    function(err, rows)
    {
    if(!err)
    {
     res.status(200).json({'returnval': arr1,'categorycnt':arr2,'map':rows});
    }
    });
    }
    });
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});




app.post('/fetchdynamicallyenteredmarks-service',  urlencodedParser,function (req, res)
{
var qur="SELECT * FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' and "+
" academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmenttype+"' and term_name='"+req.query.termname+"' and "+
" grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' order by student_name,category";
var mapqur="SELECT distinct(category_name),category_id FROM subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
" grade_name='"+req.query.grade+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesmenttype+"' order by category_name";

 console.log('--------------------------dynamic report------------------------------');
 console.log(mapqur);
 console.log('--------------------------------------------------------');
 console.log(qur);
 console.log('--------------------------------------------------------');
 var maparr=[];
 connection.query(mapqur,function(err, rows)
 {
 maparr=rows;
 connection.query(qur,function(err, rows)
  {
    if(!err)
    { 
      res.status(200).json({'maparr':maparr,'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    } 
  });
});
});

/*app.post('/fnbookplangrade-service',  urlencodedParser,function (req,res)
  {  
      var qur1="select distinct grade_id as gradeid,(select distinct grade_name from md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and  role_id='"+req.query.roleid+"' and school_id='"+req.query.schoolid+"'";

 
     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
*/




app.post('/fngetrejectsubject1-service',  urlencodedParser,function (req,res)
  {  
    var qur="select distinct chapter_id,chapter_name from md_curriculum_planning_approval where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and section_id='"+req.query.sectionidz+"' and completion_status='yes'";
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});



app.post('/fngetconceptreport-service',  urlencodedParser,function (req, res)
{

/* var qur="select f.capter_id ,f.section_id,gs.section_id as section_name,ch.capter,e.emp_name,f.emp_id ,f.concept_id,cp.concept,f.skill,f.innovation,f.value,f.remark,f.enrichment_sug,f.planning_date,f.completion_date   from  final_book_sug f  join md_grade g on(g.grade_id=f.grade_id) join md_subject s on(s.subject_id=f.subject_id) join mp_grade_section gs on(gs.class_id=f.section_id) join md_chapter ch on(ch.capter_id=f.capter_id) join   md_employee_creation e on(e.emp_id=f.emp_id)  join  md_concept  cp  on(cp.concept_id=f.concept_id)  where f.school_id='"+req.query.schoolid+"' and f.completion='No' and gs.school_id='"+req.query.schoolid+"' and gs.grade_id=f.grade_id and gs.academic_year='"+req.query.academic_year+"'  and f.academic_year='"+req.query.academic_year+"' and ch.school_id='"+req.query.schoolid+"' and  f.subject_id='"+req.query.subjectid+"' and f.grade_id='"+req.query.gradeid+"'";*/
var qur="select * from md_curriculum_planning_approval where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'and subject_id='"+req.query.subjectid+"' and grade_id='"+req.query.gradeid+"'and completion_status='No' and term_id='"+req.query.termid+"'";
 
 console.log(qur);

  console.log('-------------------Chapter Report----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});



app.post('/fngetconceptreport1-service',  urlencodedParser,function (req, res)
{


var qur="select * from md_curriculum_planning_approval where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'and subject_id='"+req.query.subjectid+"' and grade_id='"+req.query.gradeid+"'and term_id='"+req.query.termid+"' and  planned_date_from between '"+req.query.fromdate+"' and '"+req.query.todate+"'";
 
 console.log(qur);

  console.log('-------------------Chapter Report----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fngetcurriculam-service',  urlencodedParser,function (req, res)
{
  // var qur="select  s.subject_id,s.concept_id,s.capter_id,s.period,s.skill,s.innovation,s.remark,s.planning_date,ch.capter,cp.concept,b.subject_name,v.value_name from md_skill s join md_chapter ch on(ch.capter_id=s.capter_id) join md_concept cp on(cp.concept_id=s.concept_id) join md_subject b on(b.subject_id=s.subject_id) join md_book_value v on(v.rowid=s.rowid) where s.school_id='"+req.query.schoolid+"' and s.grade_id='"+req.query.gradeid+"'  and s.academic_year='"+req.query.academic_year+"' and ch.school_id='"+req.query.schoolid+"' and ch.academic_year='"+req.query.academic_year+"' and v.school_id='"+req.query.schoolid+"' and v.grade_id='"+req.query.gradeid+"'  and v.academic_year='"+req.query.academic_year+"'";

  var qur="select * from md_curriculum_planning where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and  planned_date_from between '"+req.query.fromdate+"' and '"+req.query.todate+"'";
  
  console.log('-------------------Chapter Report----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchallstudents-service',  urlencodedParser,function (req, res)
{
var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.grade+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'  and flag='active' and id not in(select student_id from tr_term_attendance where academic_year='"+req.query.academicyear+"' and  grade='"+req.query.grade+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";
  
  console.log('-------------------fetch student for addnewstud----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});




app.post('/fnsubconceptsave-service',  urlencodedParser,function (req, res)
{ 
     
    var qur="update md_sub_concept set  sub_concept_name='"+req.query.subconceptname+"' where capter_id='"+req.query.capterid+"' and concept_id='"+req.query.concept_id+"' and sub_concept_id='"+req.query.sub_concept_id+"'";

    console.log("----------- sub concept edit-------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});
app.post('/Getschoolname-service', urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});




app.post('/Emplchangepassword-service',  urlencodedParser,function (req, res)
{
  
  var username={"emp_id":req.query.username1};
  var oldpassword={"emp_password":req.query.oldpassword1};
  var newpassword={"emp_password":req.query.newpassword1};
  var schoolid={"school_id":req.query.schoolid};
  console.log(schoolid);
  console.log(username);
  console.log(oldpassword);
  console.log(newpassword);
  connection.query('UPDATE md_employee_creation SET ? WHERE ? and ? and ?',[newpassword,username,oldpassword,schoolid],
    function(err,result)
    {
      console.log('..............result..............');
      console.log(result.affectedRows);
    if(!err)
    {  
      if(result.affectedRows>0)  
      res.status(200).json({'returnval': 'Password changed!'});
    
    else
    {
      console.log(err);     
      res.status(200).json({'returnval': 'Password not changed!'});
    }
    }
    else
      console.log(err);    
  });
});



app.post('/fninnovategrade-service',  urlencodedParser,function (req,res)
  {  
      var qur1="select distinct grade_id as gradeid,(select distinct grade_name from md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and  role_id='"+req.query.roleid+"' and school_id='"+req.query.schoolid+"'";

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});




app.post('/fnselectinnovatesubject-service',  urlencodedParser,function (req, res)
{
    
  connection.query('SELECT * from md_subject',
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchchapterinnovate-service',  urlencodedParser,function (req,res)
{ 
  var qur2=" select * from md_chapter where school_id='"+req.query.schoolid+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"'";

  console.log(qur2);

   connection.query(qur2,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});



app.post('/fngetchapterinnvt-service',  urlencodedParser,function (req,res)
{ 
  var qur2=" select * from md_curriculum_planning_approval where school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"'  and chapter_id='"+req.query.capterid+"'";

  console.log("********Innovation Report*********");
  console.log(qur2);

   connection.query(qur2,
    function(err, rows){
      if(!err)
      {
          console.log(rows);
          res.status(200).json({'returnval': rows});
          
      }

      else
          console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});





app.post('/bookrefsubject-service',  urlencodedParser,function (req,res)

  {  
    var qur="select distinct(c.subjectid),s.subject_name from md_chapter c join md_subject s on(c.subjectid=s.subject_id) where c.school_id='"+req.query.school_id+"' and c.academic_year='"+req.query.academic_year+"' and c.gradeid='"+req.query.gradeid+"' order by subjectid";
    
    console.log("*******************");
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});  




app.post('/innovatechapsubject-service',  urlencodedParser,function (req,res)

  {  
    var qur="select distinct(c.subjectid),s.subject_name from md_chapter c join md_subject s on(c.subjectid=s.subject_id) where c.school_id='"+req.query.school_id+"' and c.academic_year='"+req.query.academic_year+"' and c.gradeid='"+req.query.gradeid+"' order by subjectid";
    
    console.log("*******************");
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});  

app.post('/callfetchinfofortemplate-service',  urlencodedParser,function (req,res)
  {  
     var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id  from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') "+
"and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and flag='active' order by student_name";



   var qur1="SELECT * FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' order by sub_category_id";

   var qur2="SELECT category_id,category_name,count(sub_category_id) as cnt FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' group by category_id,category_name";
    console.log(qur);
    console.log(qur1);
    console.log(qur2);

     var enricharr=[];
    var studentarr=[];
    var categorycnt=[];
    connection.query(qur,function(err, rows){
    if(!err)
    {  
    studentarr=rows;
     connection.query(qur2,function(err, rows){
    if(!err)
    {  
    categorycnt=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {  

    enricharr=rows;
    res.status(200).json({'enricharr': enricharr,'studentarr':studentarr,'categorycnt':categorycnt});
    }
    });
    }
     });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


app.post('/fetchstafffo-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT * FROM md_employee_creation where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/fnsinglegrademapping-service' , urlencodedParser,function (req, res)
{  
  var collection = { 
       school_id:req.query.schoolid,
       academic_year:req.query.academic_year,
       grade_id:req.query.gradeid,
       class_id:req.query.classid,
       subject_id:req.query.subjectid,
       id:req.query.empid,
       flage:req.query.flage,
       role_id:req.query.roleid,
       section_id:req.query.sectionid,
       school_type:req.query.schooltype,
     };
   console.log(JSON.stringify(collection));

connection.query("SELECT * FROM mp_teacher_grade WHERE id='"+req.query.empid+"' and school_type='"+req.query.schooltype+"'and school_id='"+req.query.schoolid+"'and class_id='"+req.query.classid+"' and role_id='"+req.query.roleid+"' and subject_id='"+req.query.subjectid+"'  and flage='"+req.query.flage+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO mp_teacher_grade SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });  
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });

app.post('/fnsetsingleemployee-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT id, grade_id as gradeid,(select grade_name from md_grade where grade_id=gradeid) as gradename, subject_id as subjectid,(select subject_name from md_subject where subject_id=subjectid) as subjectname ,section_id,class_id FROM mp_teacher_grade where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and flage='active' and id='"+req.query.studid+"' and role_id='subject-teacher'";
    console.log('**********************Staff mapping starts**********************');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});


app.post('/fetchsinglegrade-service',  urlencodedParser,function (req,res)
  {  
var qur1="SELECT * FROM md_grade";

var qur2="SELECT * FROM md_subject";

 var qur3="SELECT * FROM md_role";

   console.log('----------------');
   console.log(qur1);
   console.log('-----------------');
   console.log(qur2);
   console.log('-----------------');
   console.log(qur3);
   console.log('-----------------');
   
    var gradearr=[];
    var subjectarr=[];
    var rolearr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    gradearr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    subjectarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  

    rolearr=rows;
    res.status(200).json({'gradearr':gradearr,'subjectarr':subjectarr,'rolearr':rolearr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fnparentinfomation-service',  urlencodedParser,function (req,res)
  {  
  var qur="UPDATE parent SET parent_name='"+req.query.fathername1+"',mother_name='"+req.query.mothername1+"',mother_mobile='"+req.query.mothermob+"',mobile='"+req.query.fathermob+"',alternate_mail='"+req.query.motheremail+"',email='"+req.query.fatheremail+"',address1='"+req.query.address1+"',address2='"+req.query.address2+"',address3='"+req.query.address3+"',city='"+req.query.city+"',pincode='"+req.query.pincode+"'  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and student_id='"+req.query.studid+"' ";
    console.log('------------update return status -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fnpersonalinfomation-service',  urlencodedParser,function (req,res)
  {  

   var qur="UPDATE md_student SET student_name='"+req.query.studentname+"',dob='"+req.query.showdate+"',ageinmonth='"+req.query.ageofyrs+"',gender='"+req.query.gender+"'  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.studid+"' and flag='active'";
    console.log('------------update return status -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});
app.post('/sectionupdate1-service',  urlencodedParser,function (req,res)
  {  

   var qur="UPDATE md_section SET section_id='"+req.query.newsection+"',section_name='"+req.query.newsection1+"'  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and section_id='"+req.query.section1+"'";
    console.log('------------++++++++++++++++++++ -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});
app.post('/fnstudnameinfo-service',  urlencodedParser,function (req,res)
  {  
     var qur="UPDATE "+req.query.studenttable+" SET "+req.query.dbstudentname+"='"+req.query.studentname1+"' WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and ("+req.query.dbgradeid+"='"+req.query.gradeid1+"' or "+req.query.dbgradename+"='"+req.query.gradename1+"' )and ("+req.query.dbclassid+"='"+req.query.classid1+"' or  "+req.query.dbsection+"='"+req.query.section1+"') and "+req.query.dbstudid+"='"+req.query.studid1+"'";
     console.log('------------update return status -------------');
     console.log(qur);
     console.log('---------------------------------------------');
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});

app.post('/sectionupdate-service',  urlencodedParser,function (req,res)
  {  
    var qur="UPDATE "+req.query.studenttable+" SET "+req.query.dbsection+"='"+req.query.newsection+"' WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and ("+req.query.dbgradeid+"='"+req.query.gradeid1+"' or "+req.query.dbgradename+"='"+req.query.gradename1+"' )and ("+req.query.dbclassid+"='"+req.query.classid1+"' or  "+req.query.dbsection+"='"+req.query.section1+"')";
     console.log('------------delete return status -------------');
     console.log(qur);
     console.log('---------------------------------------------');
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fnsectioninfo-service', urlencodedParser,function (req,res)
  {  

 var qur="delete from "+req.query.studenttable+" WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and ("+req.query.dbgradeid+"='"+req.query.gradeid1+"' or "+req.query.dbgradename+"='"+req.query.gradename1+"' )and ("+req.query.dbclassid+"='"+req.query.classid1+"' or  "+req.query.dbsection+"='"+req.query.section1+"')";
     console.log('------------update return status -------------');
     console.log(qur);
     console.log('---------------------------------------------');
     connection.query(qur,
    function(err, rows)
    {
     if(!err)
    {    
       res.status(200).json({'returnval': 'delete!!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not delete!!'}); 
    }
  });
});

app.post('/fnstudpersonalinfo-service',  urlencodedParser,function (req,res)
  {  

  var qur="UPDATE md_admission SET first_name='"+req.query.firstname+"',middle_name='"+req.query.middlename+"',last_name='"+req.query.lastname+"',student_name='"+req.query.studentname+"',        dob='"+req.query.showdate+"',age='"+req.query.ageofyrs+"',gender='"+req.query.gender+"'  WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and admission_no='"+req.query.studid+"' and flag='1'  AND active_status='Admitted'";
    console.log('------------update *** status -------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      console.log(rows);
      res.status(200).json({'returnval': 'Updated!!'});
    }
    else
    {
     console.log(err);
     res.status(200).json({'returnval': 'Not Updated!!'}); 
    }
  });
});


app.post('/fnlaninfomation-service' , urlencodedParser,function (req, res)
{  
    var response={
            school_id:req.query.schoolid,
            academic_year:req.query.academic_year,
            grade:req.query.gradeidzzsss,
            class_id:req.query.classid,
            student_id:req.query.studid,
            section:req.query.sectionid,
            subject_id:req.query.secondlan,
            student_name:req.query.name,
            flag:'active',
            lang_pref:'Second Language',

           }
      //var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":"","noofdays":""};
        

    console.log(JSON.stringify(response));  
     var fetchqur="SELECT * FROM md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeidzzsss+"' and id='"+req.query.studid+"' and flag='active'";

   
  connection.query(fetchqur,function(err, rows){
  if(rows.length>0){
    response.class_id=rows[0].class_id;
    var qur="SELECT * FROM tr_student_to_subject WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade='"+req.query.gradeidzzsss+"'  and class_id='"+rows[0].class_id+"' and student_id='"+req.query.studid+"'and flag='active' and lang_pref='Second Language'";
    var qur1="UPDATE tr_student_to_subject set subject_id='"+req.query.secondlan+"' where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"' and class_id='"+rows[0].class_id+"' and grade='"+req.query.gradeidzzsss+"' and academic_year='"+req.query.academic_year+"' and flag='active' and lang_pref='Second Language'";
    console.log(qur);
    console.log(qur1)
   connection.query(qur,function(err, rows)
    {
    console.log(rows.length);

     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
 }
 else
 {
  console.log(err);
  res.status(200).json({'returnval': 'No rows'});
 }
 });
});

app.post('/fnlaninfomation1-service' , urlencodedParser,function (req, res)
   {  
    var response={
            school_id:req.query.schoolid,
            academic_year:req.query.academic_year,
            grade:req.query.gradeidzzsss,
            class_id:req.query.classid,
            student_id:req.query.studid,
            section:req.query.sectionid,
            subject_id:req.query.thirdlen,
            student_name:req.query.name,
            flag:'active',
            lang_pref:'Third Language',

           }
      
    console.log("------THIRD-------");  

    console.log(JSON.stringify(response));  
    console.log("-------------");  
     var fetchqur="SELECT * FROM md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeidzzsss+"' and id='"+req.query.studid+"' and flag='active'";

  
  connection.query(fetchqur,function(err, rows){
  if(rows.length>0){
    response.class_id=rows[0].class_id;
    var qur="SELECT * FROM tr_student_to_subject WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade='"+req.query.gradeidzzsss+"'  and class_id='"+rows[0].class_id+"' and student_id='"+req.query.studid+"' and flag='active' and lang_pref='Third Language'";
    var qur1="UPDATE tr_student_to_subject set subject_id='"+req.query.thirdlen+"' where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"' and class_id='"+rows[0].class_id+"' and grade='"+req.query.gradeidzzsss+"' and academic_year='"+req.query.academic_year+"' and flag='active' and lang_pref='Third Language'";
    console.log(qur);
    console.log(qur1)
   connection.query(qur,function(err, rows)
    {
    console.log(rows.length);

     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
 }
 else
 {
  console.log(err);
  res.status(200).json({'returnval': 'No rows'});
 }
 });
});

app.post('/fnacadamicsinfomation-service' , urlencodedParser,function (req, res)
   { 
    var response={
             school_id:req.query.schoolid,
             academic_year:req.query.academic_year,
             grade:req.query.gradeidzzsss,
             class_id:req.query.classid,
             student_id:req.query.studid,
             student_name:req.query.name,
             flag:'active',
             lang_pref:req.query.langpref,
             section:req.query.sectionid,
             
           }
   
    console.log(JSON.stringify(response));
      var qur="SELECT * FROM tr_student_to_subject WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and student_id='"+req.query.studid+"' and flag='active' ";

     var qur1="UPDATE tr_student_to_subject set grade='"+req.query.gradeidzzsss+"',section='"+req.query.sectionid+"', class_id='"+req.query.classid+"' where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
    console.log('******************SECTION TRANSFER STARTS*********************'+"PRECEDURE1");
    console.log(qur);
    console.log(qur1)
    console.log("---------------------");
    console.log(response);
    console.log("----------------------");
   connection.query(qur,
    function(err, rows)
    {
    console.log(rows.length);

     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});

app.post('/fnacadamicsinfomation3-service' , urlencodedParser,function (req, res)
   {  
    var response={
            school_id:req.query.schoolid,
            academic_year:req.query.academic_year,
            grade_id:req.query.gradeidzzsss,
            class_id:req.query.classid,
            id:req.query.studid,
            student_name:req.query.name,
            gender:req.query.gender,
            dob:req.query.date,
            ageinmonth:req.query.ageofyrs,
            flag:'active',
            school_type:req.query.schooltype
          
           }
      //var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":"","noofdays":""};
        

    console.log(JSON.stringify(response));
      var qur="SELECT * FROM md_student WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.studid+"' and flag='active'";

      var qur1="UPDATE md_student set class_id='"+req.query.classid+"',grade_id='"+req.query.gradeidzzsss+"' where school_id='"+req.query.schoolid+"' and id='"+req.query.studid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
   console.log('******************SECTION TRANSFER STARTS*********************'+"PRECEDURE2");
    console.log(qur);
    console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
    console.log(rows.length);

     if(rows.length==0){
     connection.query("INSERT INTO md_student SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});

app.post('/fnacadamicsinfomation1-service',  urlencodedParser,function (req,res)
  {  
   
    var qur3="Delete from tr_term_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'";

    var qur4="Delete from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'";

    var qur5="Delete from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'";
    console.log('******************SECTION TRANSFER STARTS*********************'+"PRECEDURE3");
    console.log("---------------------------------");
    console.log(qur3);
    console.log("---------------------------------");
    console.log(qur4);
    console.log("---------------------------------");
    console.log(qur5);
   
    var trdeltarr=[];
    var overdelarr=[];
    var assesmentarr=[];
    connection.query(qur3,function(err, rows){
    if(!err)
    { 
  //  trdeltarr=rows; 
    connection.query(qur4,function(err, rows){
    if(!err)
    {  
      //console.log(rows);
     // overdelarr=rows;
      connection.query(qur5,function(err, rows){
    if(!err)
    {  
      //console.log(rows);
     // assesmentarr=rows;
     res.status(200).json({'trdeltarr': 'deleted','overdelarr':'deleted','assesmentarr':'deleted'});
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);

     });
    }
    else
      console.log(err);
     //res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fnacadamicsinfomation2-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="Delete from tr_term_fa_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'"; 
var qur1="Delete from tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'"; 
var qur2="Delete from tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termid+"' and grade='"+req.query.gradenamez+"' and student_id='"+req.query.studid+"' and section='"+req.query.sectionid+"'"; 

console.log(qur);
console.log(qur1);
console.log(qur2);
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    connection.query(qur1,function(err, rows)
    {
    if(!err)
    {
    connection.query(qur2,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    });
    }
    });
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});
app.post('/addstudent-service' , urlencodedParser,function (req, res)
{  
   var response={
    school_id:req.query.schoolid,
    school_name:req.query.schoolname,
    admission_no:req.query.studnetid,
    enquiry_no:req.query.studnetid,
    first_name:req.query.firstname,
    middle_name:req.query.middlename,
    last_name:req.query.lastname,
    student_name:req.query.studentname,
    class_for_admission:req.query.grade,
    dob:req.query.dob,
    age:req.query.age,
    academic_year:req.query.academicyear,
    father_name:req.query.fathername,
    mother_name:req.query.mothername,
    gender:req.query.gender,
    transport_availed:req.query.transport,
    enquiry_no:req.query.enquiry_no,
    admission_year:req.query.academicyear,
    flag:req.query.flag,
    active_status:"Admitted",
    enquiry_no:"ENR"+req.query.studnetid,
  }   
   console.log("student add");
  console.log("-------------------------");
  console.log(response);

  connection.query("SELECT * FROM md_admission WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and admission_no='"+req.query.studnetid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_admission set ?",[response],
      function(err, rows)
      {

      if(!err)
       {
        console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });  
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });



/*app.post('/addstudent-service', urlencodedParser,function (req,res)
{      
  var response={
    school_id:req.query.schoolid,
    school_name:req.query.schoolname,
    admission_no:req.query.studnetid,
    first_name:req.query.firstname,
    middle_name:req.query.middlename,
    last_name:req.query.lastname,
    student_name:req.query.studentname,
    class_for_admission:req.query.grade,
    dob:req.query.dob,
    age:req.query.age,
    academic_year:req.query.academicyear,
    father_name:req.query.fathername,
    mother_name:req.query.mothername,
    gender:req.query.gender,
    transport_availed:req.query.transport,
    enquiry_no:req.query.enquiry_no,
    admission_year:req.query.academicyear,
    flag:req.query.flag,
  }   
  console.log("student add");
  console.log("-------------------------");
  console.log(response);
  connection.query("INSERT INTO md_admission set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
*/


/*app.post('/parentadd-service', urlencodedParser,function (req,res)
{      
  var response={
    school_id:req.query.schoolid,
    student_id:req.query.studnetid,
    parent_name:req.query.fathername,
    email:req.query.fatheremail,
    mobile:req.query.fathermob,
    address1:req.query.address1,
    address2:req.query.address2,
    address3:req.query.address3,
    city:req.query.city,
    pincode:req.query.pincode,
    alternate_mail:req.query.matheremail,
    mother_name:req.query.mothername
  }   
  console.log("student add");
  console.log("-------------------------");
  console.log(response);
  connection.query("INSERT INTO parent set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});*/


app.post('/parentadd-service' , urlencodedParser,function (req, res)
{  
   var response={
    school_id:req.query.schoolid,
    student_id:req.query.studnetid,
    parent_name:req.query.fathername,
    email:req.query.fatheremail,
    mobile:req.query.fathermob,
    address1:req.query.address1,
    address2:req.query.address2,
    address3:req.query.address3,
    city:req.query.city,
    pincode:req.query.pincode,
    alternate_mail:req.query.matheremail,
    mother_name:req.query.mothername,
    academic_year:req.query.academicyear
  }   

   console.log("student add in parent table");
  console.log("-------------------------");
  console.log(response);

  connection.query("SELECT * FROM parent WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studnetid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO parent set ?",[response],
      function(err, rows)
      {

      if(!err)
       {
        console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });  
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });


app.post('/getgradestudent-service', urlencodedParser,function (req,res)
{      
     
  var qur="SELECT * FROM md_grade";
  console.log("..........................................");
  console.log("coming in getgradestudent-service.........");
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }

    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/getgradestudent1-service', urlencodedParser,function (req,res)
{      
     
  var qur="SELECT grade_id as gradeidzz,grade_name as gradenamezz FROM md_grade";
    console.log("..........................................");
  console.log("coming in getgradestudent1-service.........");
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log('error.........'+err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/fngetinfosectionerrdilalog-service',  urlencodedParser,function (req,res){

 var qur;
   if(req.query.gradename=='Grade-1'||req.query.gradename=='Grade-2'||req.query.gradename=='Grade-3'||req.query.gradename=='Grade-4'){

qur="SELECT distinct term_name from tr_term_assesment_marks where grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and student_id='"+req.query.studid+"'"; 
   }
   else{
    qur="SELECT distinct term_name from tr_term_fa_assesment_marks where grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and student_id='"+req.query.studid+"'";
}
  
  /*var qur1="SELECT * from tr_student_to_subject  where grade='"+req.query.gradeid+"' and class_id='"+req.query.sectionid+"' and student_id='"+req.query.studid+"'";*/

   var qur1="Select t.subject_id,s.subject_name from tr_student_to_subject t join md_subject s on(s.subject_id=t.subject_id) where t.school_id='"+req.query.schoolid+"'  and  t.student_id='"+req.query.studid+"' and t.grade='"+req.query.gradeid+"' and t.class_id='"+req.query.sectionid+"' and  t.academic_year='"+req.query.academic_year+"' and t.flag='active'";

  console.log('----------------------------------------');
  console.log(qur1);
  var termarr=[];
  var langarr=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
     if(rows.length==0){
     termarr='empty';
     }
     else{
     termarr=rows;
     }
    connection.query(qur1,function(err, rows){
    if(!err)
    {
    if(rows.length==0){
       langarr='empty'
       }
      else{
       langarr=rows;
      }
     res.status(200).json({'termarr': termarr,'langarr':langarr});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/Fnfetchstudentremove-service', urlencodedParser,function (req,res)
{  
var qur;
   if(req.query.roleid=='class-teacher'||req.query.roleid=='subject-teacher'||req.query.roleid=='co-ordinator'){
 
  qur="SELECT * FROM md_student where school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academic_year+"' and flag='active' and grade_id in(select "+
    " grade_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academic_year+"' and id='"+req.query.loggedid+"' and "+
    " role_id='"+req.query.roleid+"')";
   }
    else 
    {
   qur="SELECT * FROM md_student where school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academic_year+"' and flag='active'";
    } 

   
      console.log("..........................................");
  
  console.log("coming in Fnfetchstudentremove-service.........");
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/fngetinfosectionname-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT * FROM mp_grade_section where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"'";
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/lanpref-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * from md_subject where language_pref='Second Language'";
  var qur1="SELECT * from md_subject where language_pref='Third Language'";
  console.log('----------------------------------------');
  console.log(qur);
    console.log("..........................................");
  console.log("coming in lanpref-service.........");
  var secondarr=[];
  var thirdarr=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    secondarr=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {
      thirdarr=rows;
    res.status(200).json({'secondarr': secondarr,'thirdarr':thirdarr});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/fetchstudentinfo-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT admission_no as id, student_name FROM md_admission where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and flag='1' and active_status='Admitted'";
      console.log("..........................................");
  console.log("coming in fetchstudentinfo-service.........");
  console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/fnsarchstuclassinfo-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT school_type,dob ,academic_year,id ,grade_id as gradeid,class_id as classid ,gender, ageinmonth, (select  grade_name from md_grade  where grade_id=gradeid)  as grade_name ,(select UPPER( section_id ) from mp_grade_section  where class_id=classid and  grade_id=gradeid and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' ) as section_name FROM md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and  id='"+req.query.studentid+"'  and flag='active'";
      console.log("..........................................");
  console.log("search stu info.........");
  console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});

app.post('/fngetstudentallinfo-service',  urlencodedParser,function (req,res)
  {  
var qur1="SELECT school_type,dob ,academic_year,id ,grade_id as gradeid,class_id as classid ,gender, ageinmonth, (select  grade_name from md_grade  where grade_id=gradeid)  as grade_name ,(select UPPER( section_id ) from mp_grade_section  where class_id=classid and  grade_id=gradeid and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' ) as section_name FROM md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and  id='"+req.query.studentid+"'  and flag='active'";

var qur2="SELECT * FROM parent where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and  student_id='"+req.query.studentid+"'";

 var qur3="SELECT * FROM tr_student_to_subject where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and  student_id='"+req.query.studentid+"' and flag='active'";

   console.log('----------------');
   console.log(qur1);
   console.log('-----------------');
   console.log(qur2);
   console.log('--------------');
   console.log(qur3);
    var personalarr=[];
    var langarr=[];
    var parentarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    personalarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    parentarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  

    langarr=rows;
    res.status(200).json({'personalarr':personalarr,'langarr':langarr,'parentarr':parentarr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/Prestudentremove-service', urlencodedParser,function (req,res)
{  

    var qur="SELECT s.grade_id,s.class_id,g.grade_name,UPPER(c.section_id) as section_name  FROM `md_student` s join md_grade g on(g.grade_id=s.grade_id) join mp_grade_section c on(c.class_id=s.class_id) where s.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academic_year+"'  and  s.id='"+req.query.studentid+"'  and c.school_id='"+req.query.schoolid+"' and c.academic_year='"+req.query.academic_year+"' and s.flag='active'";
  console.log(qur);   
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
})






app.post('/deletestudentremove-service',  urlencodedParser,function (req,res)
  {  
      var qur1="UPDATE md_student set flag='passive' where school_id='"+req.query.schoolid+"' and id='"+req.query.studentid+"' and academic_year='"+req.query.academic_year+"' and class_id='"+req.query.classid+"' and grade_id='"+req.query.gradeid+"' and flag='active'";

      var qur2="UPDATE tr_student_to_subject set flag='passive' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradeid+"' and class_id='"+req.query.classid+"'  and student_id='"+req.query.studentid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";

    console.log("---------------------------------");
    console.log(qur1);
    console.log("---------------------------------");
    console.log(qur2);
    var updatearr1=[];
    var delarr=[];
    connection.query(qur1,function(err, result){
    if(!err)
    { 
    // updatearr1=rows; 
    if(result.affectedRows>0){
    connection.query(qur2,function(err, result){
    if(!err)
    {  
      //console.log(rows);
      // delarr=rows;
     res.status(200).json({'updatearr1': 'updated','delarr':'updated'});
    }
    });
    }
    }
    else{
     console.log(err);
     res.status(200).json({'': 'no rows'}); 
   }
  });
});


app.post('/deletetermstudent-service',  urlencodedParser,function (req,res)
  {  
    var qur3="Delete from tr_term_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'";

    var qur4="Delete from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'";

    var qur5="Delete from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'";

    var qur6="Delete from tr_term_attendance where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'";

    var qur7="Delete from tr_term_health where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'";
     var qur8="Delete from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and grade_id='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section_id='"+req.query.section+"'";
    console.log("--------------1to4 delete info-------------------");
    console.log(qur3);
    console.log("---------------------------------");
    console.log(qur4);
     console.log("---------------------------------");
    console.log(qur5);
   console.log("---------------------------------");
    console.log(qur6);
    console.log("---------------------------------");
    console.log(qur7);
    console.log("---------------------------------");
     console.log(qur8);
   connection.query(qur3,function(err, result){
    if(!err)
    { 
   connection.query(qur4,function(err, result){
    if(!err)
    { 
   connection.query(qur5,function(err, result){
    if(!err)
    {
  connection.query(qur6,function(err, result){
    if(!err)
    {
  connection.query(qur7,function(err, result){
    if(!err)
    {     
  connection.query(qur8,function(err, result){
    if(!err)
    {  
     
     res.status(200).json({'returnval':"Deleted!"});
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);

     });
    }
    else
      console.log(err);

     });
    }
    else
      console.log(err);

     });
    }
    else
      console.log(err);

     });
    }
    else
      console.log(err);
     
  });
});

app.post('/deletetermstudent1-service',  urlencodedParser,function (req,res)
  {  


var qur="Delete from tr_term_fa_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 
var qur1="Delete from tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 
var qur2="Delete from tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 

var qur3="Delete from tr_term_attendance where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 

var qur4="Delete from tr_term_health where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 

var qur5="Delete from tr_term_overallfa_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.term+"' and grade='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section='"+req.query.section+"'"; 
 var qur6="Delete from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and grade_id='"+req.query.gradename+"' and student_id='"+req.query.studentid+"' and section_id='"+req.query.section+"'";
    console.log("--------------5t10-------------------");
    console.log(qur1);
    console.log("---------------------------------");
    console.log(qur2);
    console.log("---------------------------------");
    console.log(qur3);
    console.log("---------------------------------");
    console.log(qur4);
    console.log("---------------------------------");
    console.log(qur5);
    console.log("---------------------------------");
    console.log(qur6);
    



  connection.query(qur,function(err, result)
    {
    if(!err)
    {
 connection.query(qur1,function(err, result)
    {
    if(!err)
    {
 connection.query(qur2,function(err, result)
    {
    if(!err)
    {
  connection.query(qur3,function(err, result)
    {
    if(!err)
    {
    connection.query(qur4,function(err, result)
    {
    if(!err)
    {
    connection.query(qur5,function(err, result)
    {
    if(!err)
    {
    connection.query(qur6,function(err, result)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
     });
    }
    else
      console.log(err);
    });
    }
    else
      console.log(err);
     });
    }
     else
      console.log(err);
     });
    }
    else
      console.log(err);
    });
    
});

app.post('/flagupdatestudent-service',  urlencodedParser,function (req, res)
{ 
     
   var qur="UPDATE md_admission set flag='"+req.query.flag+"',active_status='TC' where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and admission_no='"+req.query.studentid+"' and class_for_admission='"+req.query.grade+"'";
   
    console.log("-----------admission deletion-------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/fngetstudname1-service',  urlencodedParser,function (req, res)
{
  var qur1="SELECT admission_no,first_name,age,last_name,middle_name,student_name,dob,gender,class_for_admission as gradename, (select grade_id from md_grade where grade_name=gradename )as gradeid  from md_admission where admission_no='"+req.query.studentid+"'  and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and flag='1'"; 
  console.log('------------------fetch name---------------------');

 console.log(qur1);
 connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    { 
      console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchsinglesubject-service',  urlencodedParser,function (req,res)
  {  
    
    var qur1="select* from md_grade";
    var qur2="SELECT * FROM mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and role_id='subject-teacher'";

    
    var qur3="select distinct( g.grade_id) ,a.section_id,a.class_id from mp_teacher_grade g  join  mp_grade_section a on (g.grade_id=a.grade_id) where g.school_id='"+req.query.schoolid+"'  and g.academic_year='"+req.query.academic_year+"' and  a.school_id='"+req.query.schoolid+"'  and a.academic_year='"+req.query.academic_year+"'  and g.id='"+req.query.empid+"' and subject_id='"+req.query.subjectid+"'and role_id='subject-teacher'";
      var qur4="SELECT distinct( grade_id)as gradeid,(select grade_name from md_grade where grade_id=gradeid) as gradename FROM mp_teacher_grade  where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and role_id='subject-teacher'";

    console.log("----grade-----");
    console.log(qur1);
    console.log("----dbarr-----");
    console.log(qur2);
    console.log("----section-----");
    console.log(qur3);
    console.log("-----------------------");
     console.log(qur4);
    var gradearr=[];
    var sectionarr=[];
    var dbarr=[];
    var smarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    gradearr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    dbarr=rows;
    connection.query(qur4,function(err, rows){
    if(!err)
    {  

    smarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  
    sectionarr=rows;
    res.status(200).json({'gradearr': gradearr,'dbarr':dbarr,'sectionarr':sectionarr,'smarr':smarr});
    }
    });
    }
     });
    }
    });
    }
    else
     res.status(200).json({'':'no rows'}); 
  });
});

app.post('/fngetsectionname1-service' ,  urlencodedParser,function (req, res)
{  
     
    var qur="select * from mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and grade_id='"+req.query.grade_id+"' and role_id='subject-teacher'";
    console.log('********section*************');
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
        if(rows.length>0)
      res.status(200).json({'returnval': rows});
     else
        res.status(200).json({'returnval': 'empty'});

    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Invalid'});
    }
    });
    });

app.post('/fngetsectionname-service',  urlencodedParser,function (req,res)
  {  
    

  var qur1="SELECT * FROM mp_grade_section where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"'  and grade_id  not in(select distinct( grade_id) from mp_teacher_grade  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"'  and id='"+req.query.empid+"'  and subject_id='"+req.query.subjectid+"' and role_id='subject-teacher')";

    var qur2="SELECT * FROM mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and role_id='subject-teacher'";

    var qur3="select distinct( g.grade_id) ,a.section_id,a.class_id from mp_teacher_grade g  join  mp_grade_section a on (g.grade_id=a.grade_id) where g.school_id='"+req.query.schoolid+"'  and g.academic_year='"+req.query.academic_year+"' and  a.school_id='"+req.query.schoolid+"'  and a.academic_year='"+req.query.academic_year+"'  and g.id='"+req.query.empid+"' and subject_id='"+req.query.subjectid+"'and role_id='subject-teacher'";
    console.log("----grade-----");
    console.log(qur1);
    console.log("----dbarr-----");
    console.log(qur2);
    console.log("----section-----");
    console.log(qur3);
    console.log("-----------------------");
    var sectionarr=[];
    var dbarr=[];
    var mastersectionarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    sectionarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    dbarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  
    mastersectionarr=rows;
    res.status(200).json({'sectionarr': sectionarr,'dbarr':dbarr,'mastersectionarr':mastersectionarr});
    }
    });
    }
     });
    }
    else
     res.status(200).json({'':'no rows'}); 
  });
});

app.post('/fngetsectionname2-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="delete  from mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and grade_id='"+req.query.grade_id+"' and role_id='subject-teacher'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
       
     res.status(200).json({'returnval': 'Deleted!'});

    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });

  app.post('/fngetsectionname3-service',  urlencodedParser,function (req,res)
  {  
    

 

    var qur2="SELECT * FROM mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and role_id='subject-teacher'";

    var qur3="select distinct( g.grade_id) ,a.section_id,a.class_id from mp_teacher_grade g  join  mp_grade_section a on (g.grade_id=a.grade_id) where g.school_id='"+req.query.schoolid+"'  and g.academic_year='"+req.query.academic_year+"' and  a.school_id='"+req.query.schoolid+"'  and a.academic_year='"+req.query.academic_year+"'  and g.id='"+req.query.empid+"' and subject_id='"+req.query.subjectid+"'and role_id='subject-teacher'";
   
    console.log("----dbarr-----");
    console.log(qur2);
    console.log("----section-----");
    console.log(qur3);
    console.log("-----------------------");
    var dbarr=[];
    var mastersectionarr=[];
    
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    dbarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    {  
    mastersectionarr=rows;
    res.status(200).json({'dbarr':dbarr,'mastersectionarr':mastersectionarr});
    }
    });
    }
   
    else
     res.status(200).json({'':'no rows'}); 
  });
});


app.post('/singleempsection-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="delete  from mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"'  and id='"+req.query.empid+"' and class_id='"+req.query.classid+"' and grade_id='"+req.query.grade_id+"' and role_id='subject-teacher'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
       
     res.status(200).json({'returnval': 'Deleted!'});

    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });


  app.post('/fnsetsingledeleteemployee-service' ,  urlencodedParser,function (req, res)
{  
   var qur="Delete from mp_teacher_grade where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"' and grade_id='"+req.query.gradeid+"'  and id='"+req.query.empidz+"' and class_id='"+req.query.classid+"' and flage='active' and role_id='subject-teacher'"; 
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});


app.post('/fngetauditlevel-service', urlencodedParser,function (req,res)
{  
    var qur="SELECT assesment_level2 FROM tr_term_auditimport where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";
    console.log('-----------------------------');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length==0){
      res.status(200).json({'returnval': "empty"});  
      }
      else{
      console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});  
      }
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
  });
});


app.post('/fnimporttermmarks1-service',  urlencodedParser,function (req, res)
{ 
     
    var qur="UPDATE tr_term_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'";

    console.log("-------------flag update in import marks-----------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});
app.post('/fnimporttermmarks11-service',  urlencodedParser,function (req, res)
{ 
     
     var qur="delete from  tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"'";

    console.log("---------aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-----------");
    console.log(qur);

    connection.query(qur,
      function(err, result)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/fndeltoverallassesmarks1-service',  urlencodedParser,function (req,res)
  {  
      var qur1="DELETE from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and assesment_id='"+req.query.assesmentid+"' and term_name='"+req.query.termname+"' and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";


      var qur2="DELETE from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";

    console.log("---------------delete overall marks------------------");
    console.log(qur1);
    console.log("---------------------------------");
    console.log(qur2);
    var overallassesment1=[];
    var overmarkarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    { 
    overallassesment1=rows; 
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
      //console.log(rows);
      overmarkarr=rows;
     res.status(200).json({'overallassesment1': 'deleted','overmarkarr':'deleted'});
    }
    });
    }
    else{
      console.log(err);
     res.status(200).json({'': 'no rows'}); 
   }
  });
});

app.post('/fntermauditmarks1-service',  urlencodedParser,function (req, res)
{ 
     
    var qur="UPDATE tr_term_auditimport set assesment_level2='"+req.query.asseslevel1+"' where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";

    console.log("-------------Assesment level update-------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Updated'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});


app.post('/deleteauditmarks1-service',  urlencodedParser,function (req, res)
{ 
     
    var qur="Delete from  tr_term_auditimport where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"'";

    console.log("-------------Assesment level Delete-------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': 'Deleted'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/ninetotenemail-service', urlencodedParser,function (req, res)
{ 
     
    var qur="SELECT * from parent where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"'";

    console.log("-------------Parent information-----------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    console.log(rows);
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/fivetoeightreportemail-service',  urlencodedParser,function (req, res)
{ 
 
    var qur="SELECT * from parent where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studentid+"'";

    console.log("----------------------------------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});
app.post('/ReportCardsubjectvalue-service',  urlencodedParser,function (req, res)
{ 
      if(req.query.comparisonvalue=="Report Card")
      {
       var qur="SELECT distinct (subject_name),subject_id FROM `subject_mapping` where grade_name='"+req.query.gradename+"'";

         }
    else if(req.query.comparisonvalue=="Enrichment")
         {
           var qur="SELECT distinct (subject_name),subject_id FROM `enrichment_subject_mapping` where grade_name='"+req.query.gradename+"'";

         }

    console.log("------------------comparison subject----------------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });
});

app.post('/ReportCardandEnrichmentcategoryvalue-service',  urlencodedParser,function (req, res)
{ 

  
      if(req.query.comparisonvalue=="Report Card")
      {
       var qur="SELECT distinct (category_name),subject_id FROM `subject_mapping` where grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subjectname+"'";

         }
    else if(req.query.comparisonvalue=="Enrichment")
         {
       var qur="SELECT distinct (category_name),subject_id FROM `enrichment_subject_mapping` where grade_name='"+req.query.gradename+"' and subject_name='"+req.query.subjectname+"'";

         }

    console.log("------------------comparison category----------------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

  });   
});
app.post('/CompareservicesourcegraphinEnrichment-service',  urlencodedParser,function (req, res)
{ 

  var qur1="select distinct(subject_name) as subject_name from tr_beginner_assesment_marks where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  "section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"'";

   var qur="select count(distinct(student_id)) as score,level,grade,subject_name from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' group by level,grade,subject_name";  
 

    console.log("------------------enrichment count----------------------");
    console.log(qur);
    console.log(qur1);
   var subarr=[];
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
        {  
        subarr=rows;  
     connection.query(qur,  function(err, rows)
      {
        if(!err)
        {    
          if(rows.length>0)
              res.status(200).json({'returnval': rows,'subject':subarr});
            else
              res.status(200).json({'returnval': 'invalid','subject':'invalid'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

    }); }  

  });
});

app.post('/CompareservicesourcegraphinEnrichment1-service',  urlencodedParser,function (req, res)
{ 

 var qur="SELECT subject_id,(sum(rtotal)/(select count( distinct( category_name)) from subject_mapping  where subject_name='english' and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' )) as score,student_id FROM `tr_term_assesment_overall_assesmentmarks`where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' group by subject_id,student_id ";
  var qur1="select distinct(subject_id) as subject_name from tr_term_assesment_overall_assesmentmarks  where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+
  "section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"'";
   var qur2="select * from md_grade_rating";

  var qur1="select distinct(category_name) as subject_name  from tr_beginner_assesment_marks where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  "section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"'  and category_name='"+req.query.category+"'";

   var qur="select category_name as subject_name,count(distinct(student_id)) as score,level,grade from tr_beginner_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"' and "+
  " section_id='"+req.query.section+"' and subject_name='"+req.query.subject+"' and assesment_type='"+req.query.assesment+"' and category_name='"+req.query.category+"' group by level,grade,category_name";  
 

    console.log("------------------enrichment count----------------------");
    console.log(qur);
    console.log(qur1);
   var subarr=[];
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
        {  
        subarr=rows;  
     connection.query(qur,  function(err, rows)
      {
        if(!err)
        {    
           if(rows.length>0)
              res.status(200).json({'returnval': rows,'subject':subarr});
            else
              res.status(200).json({'returnval': 'invalid','subject':'invalid'});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

    }); }  

  });
});

app.post('/CompareservicesourcegraphinReportCard1-service',  urlencodedParser,function (req, res)
{ 
    if(req.query.grade=="Grade-1" ||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4"){

  var qur1="select distinct(category) as subject_name from tr_term_assesment_overall_assesmentmarks  where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' and  category='"+req.query.category+"'";

   var qur="SELECT  count(term_cat_grade)as score,term_cat_grade as grade,  category as subject_name,subject_id,sum(rtotal) as scorevalue  from tr_term_assesment_overall_assesmentmarks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' and  category='"+req.query.category+"' group by term_cat_grade ";  
 

}
else{

 var qur1="select distinct(category) as subject_name from tr_term_fa_assesment_marks  where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' and  category='"+req.query.category+"'";

   var qur="SELECT  student_id,  category as subject_name,sum(mark) as score from tr_term_fa_assesment_marks "+
  " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' and  category='"+req.query.category+"' group by student_id ";  
 

}
 

    console.log("------------------enrichment count----------------------");
    console.log(qur);
    console.log(qur1);
   var subarr=[];
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
        {  
        subarr=rows;  
     connection.query(qur,  function(err, rows)
      {
        if(!err)
        {  
           if(rows.length>0)
              res.status(200).json({'returnval': rows,'subject':subarr});
            else
              res.status(200).json({'returnval': 'invalid','subject':'invalid'});

        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

    }); }  

  });
});

app.post('/CompareservicesourcegraphinReportCard-service',  urlencodedParser,function (req, res)
{ 

  var qur;
  var qur1;
     if(req.query.grade=="Grade-1" ||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4"){

 qur="SELECT subject_id,(sum(rtotal)/(select count( distinct( category_name)) from subject_mapping  where subject_name='"+req.query.subject+"' and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' )) as score,student_id FROM `tr_term_assesment_overall_assesmentmarks`where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' group by subject_id,student_id ";

  qur1="select distinct(subject_id) as subject_name from tr_term_assesment_overall_assesmentmarks  where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+
  "section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"'";
    
     }else{

 /*  var qur="SELECT subject_id,(sum(rtotal)/(select count( distinct( category_name)) from subject_mapping  where subject_name='"+req.query.subject+"' and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' )) as score,student_id FROM `tr_term_fa_assesment_marks `where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' group by subject_id,student_id ";*/
   
 qur="SELECT  subject_id,(sum(mark)/(select count( distinct( category_name)) from subject_mapping  where subject_name='"+req.query.subject+"' and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' )) as score,student_id FROM tr_term_fa_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+"section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' group by subject_id,student_id" ;
  
  qur1="select distinct(subject_id) as subject_name from tr_term_fa_assesment_marks  where "+
  "school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+
  "section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"'";
 }
  var qur2="select * from md_grade_rating";

  /* var qur="SELECT term_cat_grade as grade,count(distinct(student_id)) as score,rtotal,subject_id as subject_name FROM `tr_term_assesment_overall_assesmentmarks` where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and "+
  " section='"+req.query.section+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.assesment+"' group by term_cat_grade,subject_id";  */
     
   console.log("------------------Reportcard count----------------------");
    console.log(qur);
    console.log(qur1);
   var subarr=[];
   var graderatarr=[];
    connection.query(qur2,  function(err, rows)
      {
     if(!err)
        {  
        graderatarr=rows;  
        connection.query(qur1,  function(err, rows)
      {
     if(!err)
        {  
        subarr=rows;  
     connection.query(qur,  function(err, rows)
      {
        if(!err)
        {  
         if(rows.length>0)
          res.status(200).json({'returnval': rows,'subject':subarr,'graderatarr':graderatarr});
            else
              res.status(200).json({'returnval': 'invalid','subject':'invalid','graderatarr':'invalid'});  
          
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

      }); } 
     }); }  
    });
});

app.post('/compareservicegrademaster-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from md_grade_rating";
    var qur1="select * from newformat_scholastic_grademaster";
      
   console.log("------------------Reportcard count----------------------");
    console.log(qur);
    console.log(qur1);
    var reportcardarr=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
        {  
        reportcardarr=rows;  
        connection.query(qur1,  function(err, rows)
      {
      if(!err)
        {    
          res.status(200).json({'returnval': rows,'reportcardarr':reportcardarr});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  

      }); } 
      
    });
});

app.post('/performance-fetchbranch-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from md_school";      
    console.log("------------------Fetch branch----------------------");
    console.log(qur);
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        res.status(200).json({'returnval': rows});
      }  
    });
});
app.post('/performance-fetchacademicyear-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from md_academicyear";      
    console.log("------------------Fetch acyear----------------------");
    console.log(qur);
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        res.status(200).json({'returnval': rows});
      }  
    });
});
app.post('/performance-fetchgrade-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from md_school_grade_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";      
    console.log("------------------Fetch grade----------------------");
    console.log(qur);
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        res.status(200).json({'returnval': rows});
      }  
    });
});
app.post('/performance-fetchsection-service',  urlencodedParser,function (req, res)
{ 
    var qur="select *,UPPER(section_id) as section_name from mp_grade_section where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradeid+"'";      
    console.log("------------------Fetch section----------------------");
    console.log(qur);
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        res.status(200).json({'returnval': rows});
      }  
    });
});
app.post('/performance-fetchassesmentinfo-service',  urlencodedParser,function (req, res)
{ 
    var qur="select school_id,academic_year,assesment_type,subject_name,grade_id,section_id,grade,level, "+
    " count(distinct(student_id)) as count FROM tr_beginner_assesment_marks b where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
    " and grade_id='"+req.query.grade+"' and section_id='"+req.query.section+"' group by school_id,academic_year,assesment_type, "+
    " subject_name,grade_id,section_id,grade,level order by (select id from enrichment_assesment_type where name=b.assesment_type),subject_name,grade";      
    var qur1="SELECT * FROM enrichment_grade_master";
    var qur2="SELECT count(id) as total FROM md_student WHERE class_id in(SELECT id FROM md_class_section WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and class='"+req.query.grade+"' and section='"+req.query.section+"')";
    console.log("------------------Fetch performance1 data----------------------");
    console.log(qur);
    console.log(qur1);
    console.log(qur2);
    var arr=[];
    var grade=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      { 
      arr=rows;
      connection.query(qur1,  function(err, rows)
      {
     if(!err)
      { 
      grade=rows;
      connection.query(qur2,  function(err, rows)
      {
     if(!err)
      { 
        res.status(200).json({'returnval': arr,'grade':grade,'total':rows[0].total});
      }
      else
        console.log(err);
      });
      }
      else
        console.log(err);
      });
      }
      else
        console.log(err);  
    });
});

app.post('/performance-fetchassesmentcategory-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from enrichment_subject_mapping where school_id='"+req.query.schoolid+"' "+
    " and academic_year='"+req.query.academicyear+"' and assesment_type='"+req.query.assesment+"' "+
    " and grade_name='"+req.query.gradename+"' order by subject_name";   
    var qur1="select distinct(level_config),assesment_type,category_name,sub_category_name  from enrichment_subject_mapping where school_id='"+req.query.schoolid+"' "+
    " and academic_year='"+req.query.academicyear+"' and assesment_type='"+req.query.assesment+"' "+
    " and grade_name='"+req.query.gradename+"' order by subject_name";    
    console.log("------------------Fetch assesment category----------------------");
    console.log(qur);
    console.log(qur1);
    var overall=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        overall=rows;
        connection.query(qur1,  function(err, rows)
      {
      if(!err)
      { 
        res.status(200).json({'returnval': overall,'levelconfig':rows});
      }
      else
        console.log(err);
      });
      } 
      else
        console.log(err); 
    });
});

app.post('/performance-fetchsublevelstudent-service',  urlencodedParser,function (req, res)
{ 
    var qur="select count(distinct(student_id)) as count,"+req.query.configcolumn+" as category,category_name,sub_category_name,level,grade,subject_name from "+
    " tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
    " and grade_id='"+req.query.gradename+"' and section_id='"+req.query.sectionname+"' and assesment_type='"+req.query.assesment+"' and category_name='"+req.query.category+"' and sub_category_name='"+req.query.subcategory+"' "+
    " group by "+req.query.configcolumn+",category_name,sub_category_name,level,subject_name order by subject_name,grade,level,"+req.query.configcolumn+"";
    var qur2="select count(distinct(student_id)) as count,subject_name,category_name, "+
    " sub_category_name,level,grade from tr_beginner_assesment_marks where "+
    " school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradename+"' and section_id='"+req.query.sectionname+"' and "+
    " assesment_type='"+req.query.assesment+"' and category_name='"+req.query.category+"' and sub_category_name='"+req.query.subcategory+"' group by subject_name,category_name,sub_category_name,level,grade";
    console.log("------------------Fetch students----------------------");
    console.log(qur);
    console.log(qur2);
    var arr=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
      for(var i=0;i<rows.length;i++){
        rows[i].assesment=req.query.assesment;
        // if(rows[i].sub_category_name==req.query.subcategory)
        rows[i].configcolumn=req.query.configcolumn;
        // else{
        // rows.splice(i,1);
        // i--;
        // }
      }
      arr=rows;
      connection.query(qur2,  function(err, rows)
      {
      if(!err)
      {         
        res.status(200).json({'returnval': arr,'total':rows});
      }
      else
        console.log(err);
      });
      }
      else
        console.log(err);  
    });
});

app.post('/performance-fetchlevelbasedstudents-service',  urlencodedParser,function (req, res)
{ 
    var qur="select distinct(student_id),student_name,"+req.query.configcolumn+" as category,category_name,sub_category_name,level,grade,assesment_id,(select distinct(id) from enrichment_grade_master where category=t.level) as level_id,"+
    " (select distinct(id) from enrichment_detail_grade_master where level=t."+req.query.configcolumn+") as sublevel_id from tr_beginner_assesment_marks t "+
    " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradename+"' and section_id='"+req.query.sectionname+"' "+
    " and subject_name='"+req.query.subject+"' and category_name='"+req.query.categoryname+"' and sub_category_name='"+req.query.subcategory+"' group by student_id,student_name, "+
    " subject_name,category_name,sub_category_name,"+req.query.configcolumn+",assesment_id,grade,level order by (select id from enrichment_assesment_type where name=t.assesment_id),"+req.query.configcolumn+"";  
    var qur1="select distinct(student_id),student_name,"+req.query.configcolumn+" as category,category_name,sub_category_name,level,grade,assesment_id,(select distinct(id) from enrichment_grade_master where category=t.level) as level_id, "+
    " (select distinct(id) from enrichment_detail_grade_master where level=t."+req.query.configcolumn+") as sublevel_id from tr_beginner_assesment_marks t "+
    " where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.gradename+"' and section_id='"+req.query.sectionname+"' "+
    " and subject_name='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and category_name='"+req.query.categoryname+"' and sub_category_name='"+req.query.subcategory+"' and level='"+req.query.level+"' group by student_id,student_name, "+
    " subject_name,(select id from enrichment_assesment_type where name=t.assesment_id),category_name,sub_category_name,"+req.query.configcolumn+",assesment_id,grade,level order by "+req.query.configcolumn+"";    
    var qur3="SELECT * FROM tr_level_config";
    var qur3="SELECT * FROM tr_sublevel_config";
    console.log("------------------Fetch level student info----------------------");
    console.log(qur);
    console.log(qur1);
    console.log("----------------------------------------");
    var arr=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        arr=rows;
        connection.query(qur1,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': arr,'levelarr': rows});
        }
        else
        console.log(err);
        });
      }  
      else
        console.log(err);
    });
});

app.post('/scorecard-fetchstudentacademicyear-service',  urlencodedParser,function (req, res)
{ 
    var qur="SELECT academic_year FROM md_student WHERE school_id='"+req.query.schoolid+"' AND id='"+req.query.studentid+"' order by academic_year";
    console.log("------------------Fetch student academicyear----------------------");
    console.log(qur);
    var arr=[];

        connection.query(qur,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': rows});
        }
        else
          console.log(err);
        });
});

app.post('/scorecard-fetchstudentterm-service',  urlencodedParser,function (req, res)
{ 
    var qur="SELECT distinct(term_name) FROM md_grade_assesment_mapping WHERE grade_id in(SELECT grade_id FROM md_student WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND id='"+req.query.studentid+"' order by academic_year) AND school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"'";
    var qur1="SELECT *,(select grade_name from md_grade where grade_id=s.grade_id) as grade_name FROM md_student s join mp_grade_section g on(s.class_id=g.class_id) WHERE s.grade_id=g.grade_id AND g.school_id='"+req.query.schoolid+"' AND g.academic_year='"+req.query.academicyear+"' AND s.school_id='"+req.query.schoolid+"' AND s.academic_year='"+req.query.academicyear+"' AND s.id='"+req.query.studentid+"' "+
    "";
    console.log("------------------Fetch student academicyear----------------------");
    console.log(qur);
    var arr=[];
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        arr=rows;
        connection.query(qur1,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': arr,'info': rows});
        }
        });
      }  
    });
});

app.post('/reversalfetchauditlevel-service',  urlencodedParser,function (req, res)
{ 
    var qur="select assesment_id as level from md_assesment where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and assesment_name in(SELECT assesment_level2 as level FROM tr_term_auditimport WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query
    .grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"')";
    var qur1="SELECT MIN(CAST(assesment_id as UNSIGNED)) as minlevel,MAX(CAST(assesment_id as UNSIGNED)) as maxlevel FROM md_assesment where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    var qur2="SELECT assesment_id as level FROM md_assesment WHERE assesment_name='"+req.query.assesment+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
    console.log("------------------Fetch student academicyear----------------------");
    console.log(qur);
    var auditlevel="",minlevel="",maxlevel="";
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        auditlevel=rows[0].level;
        connection.query(qur1,  function(err, rows)
        {
        if(!err)
        {
          minlevel=rows[0].minlevel;
          maxlevel=rows[0].maxlevel;
          connection.query(qur2,  function(err, rows)
          {
          if(!err)
          {  
          res.status(200).json({"currlevel":rows[0].level,"auditlevel":auditlevel,"maxlevel":maxlevel,"minlevel":minlevel});
          }
          });
        }
        });
      }  
      else
        console.log(err);
    });
});

app.post('/reversalupdatelevel-service',  urlencodedParser,function (req, res)
{ 
    
    var qur1="update tr_term_assesment_import_marks set flag='0' where assesment_id in "+
    "(select assesment_name from md_assesment where assesment_id>='"+req.query.currlevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject='"+req.query.subject+"'";
    var qur2="update tr_term_auditimport set assesment_level2=(select assesment_name from md_assesment where "+
    "assesment_id='"+req.query.updatelevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"'";
    var qur3="delete from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"'";
    var qur4="delete from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"' and assesment_id in(select assesment_name from md_assesment where "+
    "assesment_id>='"+req.query.currlevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";

    console.log("------------------reversal----------------------");
    console.log(qur1);
    console.log("------------------reversal----------------------");
    console.log(qur2);
    console.log("------------------reversal----------------------");
    console.log(qur3);
    console.log("------------------reversal----------------------");
    console.log(qur4);
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
      {  
        connection.query(qur2,  function(err, rows)
        {
        if(!err)
        {
          connection.query(qur3,  function(err, rows)
          {
          if(!err)
          { 
          connection.query(qur4,  function(err, rows)
          {
          if(!err)
          {  
          res.status(200).json({"returnval":"Reverted"});
          }
          else
            console.log(err);
          });
          }
          else
            console.log(err);
          });
        }
        else
            console.log(err);
        });
      }  
      else
        console.log(err);
    });
});

app.post('/reversalupdateimport-service',  urlencodedParser,function (req, res)
{ 
    
    var qur1="update tr_term_assesment_import_marks set flag='0' where assesment_id ='"+req.query.assesment+"' and school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject='"+req.query.subject+"'";
    var qur2="delete from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"' and assesment_id ='"+req.query.assesment+"'";
    var qur3="delete from tr_term_assesment_overall_assesmentmarks where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"' ";

    console.log("------------------reversal----------------------");
    console.log(qur1);
    console.log("------------------reversal----------------------");
    console.log(qur2);
    console.log("------------------reversal----------------------");
    console.log(qur3);
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
      {  
        connection.query(qur2,  function(err, rows)
        {
        if(!err)
        {
          connection.query(qur3,  function(err, rows)
          {
          if(!err)
          { 
          res.status(200).json({"returnval":"Reverted"});
          }
          else
            console.log(err);
          });
        }
        else
            console.log(err);
        });
      }  
      else
        console.log(err);
    });
});


app.post('/reversalupdatelevel1-service',  urlencodedParser,function (req, res)
{ 
  var qur1="update tr_term_assesment_import_marks set flag='0' where assesment_id in "+
    "(select assesment_name from md_assesment where assesment_id>='"+req.query.currlevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject='"+req.query.subject+"'";
    var qur2="update tr_term_auditimport set assesment_level2=(select assesment_name from md_assesment where "+
    "assesment_id='"+req.query.updatelevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"'";
    var qur3="delete from tr_term_assesment_overall_marks where school_id='"+req.query.schoolid+"' "+
    "and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "and subject_id='"+req.query.subject+"' and assesment_id in(select assesment_name from md_assesment where "+
    "assesment_id>='"+req.query.currlevel+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"')";

    console.log("------------------reversal----------------------");
    console.log(qur1);
    console.log("------------------reversal----------------------");
    console.log(qur2);
    console.log("------------------reversal----------------------");
    console.log(qur3);
    connection.query(qur1,  function(err, rows)
      {
     if(!err)
      {  
        connection.query(qur2,  function(err, rows)
        {
        if(!err)
        {
          connection.query(qur3,  function(err, rows)
          {
          if(!err)
          { 
          res.status(200).json({"returnval":"Reverted"});
          }
          else
            console.log(err);
          });
        }
        else
            console.log(err);
        });
      }  
      else
        console.log(err);
    });
});

app.post('/gettermvalue-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_term where school_board='"+req.query.board+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/generateterm-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM sequence";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/passtermsalue-service' , urlencodedParser,function (req, res)
{  
  var response={

               "school_board":req.query.board,
               "school_id":req.query.school_id,
               "academic_year":req.query.academic_year,
               "term_name":req.query.termname,
               "term_id":req.query.generatevalue,
               "id":req.query.id,
               "term":req.query.term,
          }; 
       console.log(response);
         var qur="SELECT * FROM md_term WHERE school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termname+"'";

    // var qur1="update md_term set term_name='"+req.query.termname+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.generatevalue+"'";

    console.log("------------");
    console.log(qur);
  //  console.log(qur1)
    connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
      //console.log(qur);
     connection.query("INSERT INTO md_term SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
     
    var tempseq1=parseInt((req.query.generatevalue).substring(1))+1;
      connection.query("UPDATE sequence SET term_seq='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted!'});
      });

    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
      res.status(200).json({'returnval': 'All ready exist'});
   });
});

app.post('/updatepasstermvalue-service' , urlencodedParser,function (req, res)
{  
     var qur1="update md_term set term_name='"+req.query.termname+"',term='"+req.query.term+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"' and school_board='"+req.query.board+"'";
     
     var qur="select * from md_term where term_name='"+req.query.termname+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and  school_board='"+req.query.board+"'";
console.log(qur);
 connection.query(qur,function(err, rows){  
        if(!err)
        {
          if(rows.length==0){
          connection.query(qur1,function(err, rows){  
            //console.log('update');
         if(!err)
         res.status(200).json({'returnval': 'updated successfully'});
         else
        res.status(200).json({'returnval': 'not updated'});
         }); 
          }
        else{
        res.status(200).json({'returnval': 'All ready this term name created'});

          }
        }
        else{
        res.status(200).json({'returnval': 'invalid'});

          }
 
      });
  });

app.post('/deletepasstermvalue-service' , urlencodedParser,function (req, res)
{  
     var qur1="delete from md_term where term_name='"+req.query.termname+"' and  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and term_id='"+req.query.termid+"' and school_board='"+req.query.board+"'";

    connection.query(qur1,function(err, result){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'Deleted successfully'});
        else
        res.status(200).json({'returnval': 'not Deleted'});
        });
  });
app.post('/getassesmentvalue-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_assesment where school_board='"+req.query.board+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' ";
  console.log(qur);
   connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/passassesmentvalue-service' , urlencodedParser,function (req, res)
{  
  var response={
               "school_board":req.query.board,
               "school_id":req.query.school_id,
               "academic_year":req.query.academic_year,
               "assesment_id":req.query.assesmentid,
               "assesment_name":req.query.assesment,
            }; 
       console.log(response);
         var qur="SELECT * FROM md_assesment WHERE school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and assesment_name='"+req.query.assesment+"'";
   connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
   connection.query("INSERT INTO md_assesment SET ?",[response],
     function(err, rows)
     {
     if(!err)
     {
      var tempseq1=parseInt((req.query.assesmentid))+1;
      connection.query("UPDATE sequence SET assesment_seq='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted!'});
      });

    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
      res.status(200).json({'returnval': 'All ready exist'});
   });
});

app.post('/updatepassassesmentvalue-service' , urlencodedParser,function (req, res)
{  
     var qur1="update md_assesment set assesment_name='"+req.query.assesment+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and assesment_id='"+req.query.assesmentid+"' and school_board='"+req.query.board+"'";
     
     var qur="select * from md_assesment where assesment_name='"+req.query.assesment+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and  school_board='"+req.query.board+"'";
console.log(qur);
 connection.query(qur,function(err, rows){  
        if(!err)
        {
          if(rows.length==0){
          connection.query(qur1,function(err, rows){  
            //console.log('update');
         if(!err)
         res.status(200).json({'returnval': 'updated successfully'});
         else
        res.status(200).json({'returnval': 'not updated'});
         }); 
          }
        else{
        res.status(200).json({'returnval': 'All ready this term name created'});

          }
        }
        else{
        res.status(200).json({'returnval': 'invalid'});

          }
 
      });
  });

app.post('/deletepassassesmentvalue-service' , urlencodedParser,function (req, res)
{  
      var qur1="delete from md_assesment where assesment_name='"+req.query.assesmenvalue+"' and  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and assesment_id='"+req.query.assesmenid+"' and school_board='"+req.query.board+"'";
    console.log(qur1);
    connection.query(qur1,function(err, result){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'Deleted successfully'});
        else
        res.status(200).json({'returnval': 'not Deleted'});
        });
  });
app.post('/selectsectiongrade-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/assesmentgrade-service' , urlencodedParser,function (req, res)
{  
     var qur1="select * from md_school_grade_mapping  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and school_type='"+req.query.schooltypeid+"'";
    console.log(qur1);
    connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': rows});
        else
        res.status(200).json({'returnval': 'invalid'});
        });
  });


app.post('/termgeneratevalue-service' , urlencodedParser,function (req, res)
{  
     var qur="select * from md_term  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and school_board='"+req.query.board+"'";

     var qur1="select * from md_assesment  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and school_board='"+req.query.board+"'";

     var qur2="select * from md_grade_assesment_mapping  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'";
    console.log("-------------Assesment-to-term-grade-mapping---------------");
    console.log(qur);
    console.log(qur1);
    console.log(qur2);
    console.log("-----------------------------------------------------------");
       var termarr=[];
       var assesmentarr=[];

        connection.query(qur,function(err, rows){  
       if(!err)
        termarr=rows;
         connection.query(qur1,function(err, rows){  
       if(!err)
        assesmentarr=rows;
         connection.query(qur2,function(err, rows){  
       if(!err)
        res.status(200).json({'returnval': rows,'termarr':termarr,'assesmentarr':assesmentarr});
        else
        res.status(200).json({'returnval': 'invalid'});
        });
       });
       });
  });

app.post('/termtogrademappingvalue-service' , urlencodedParser,function (req, res)
{  
  var response={

                "school_id":req.query.school_id,
               "academic_year":req.query.academic_year,
               "term_name":req.query.termname,
               "term_id":req.query.termid,
               "term_name":req.query.termname,
               "assesment_id":req.query.assesmentid,
               "assesment_name":req.query.assesmentname,
               "grade_name":req.query.gradename,
               "grade_id":req.query.gradeid,
              
          }; 
       console.log(response);
     var qur="SELECT * FROM md_grade_assesment_mapping WHERE school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and term_name='"+req.query.termname+"' and assesment_name='"+req.query.assesmentname+"' and grade_id='"+req.query.gradeid+"'";
   
     console.log(qur);
    connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO md_grade_assesment_mapping SET ?",[response],
      function(err, rows)
     {
     if(!err)
      res.status(200).json({'returnval': 'Inserted!'});
    else
      res.status(200).json({'returnval': 'Not Inserted!'});
   
    });
    }
    else
      res.status(200).json({'returnval': 'All ready exist'});
   });
});
app.post('/checktermmapping-service' , urlencodedParser,function (req, res)
{  
      var qur1="delete from md_grade_assesment_mapping  where assesment_name='"+req.query.assesmentname+"' and  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'  and term_name='"+req.query.termname+"'  and grade_id='"+req.query.gradeid+"'";
     console.log(qur1);
    connection.query(qur1,function(err, result){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'Deleted successfully'});
        else
        res.status(200).json({'returnval': 'not Deleted'});
        });
  });
  app.post('/getassesment-service',  urlencodedParser,function (req,res)
{  
 var qur="select * from md_school_grade_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and school_type='"+req.query.schooltypid+"'";
   console.log(qur);
  connection.query(qur,function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});

 app.post('/getassesmentandgrade3-service',  urlencodedParser,function (req,res)
{  
 var qur="select distinct(type) from md_subject";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});



app.post('/getassesmentandgrade-service',  urlencodedParser,function (req,res)
{  
  var qur1;
 var qur= "select r.subject_id,(select subject_name from md_subject where subject_id=r.subject_id)as subjectname from mp_grade_subject r where r.school_id='"+req.query.school_id+"' and r.academic_year='"+req.query.academic_year+"' and r.grade_id='"+req.query.gradeid+"' and  r.subject_id in ( select subject_id from md_subject  where type='"+req.query.type+"')";
 if(req.query.type=="Each"){
 qur1= "select distinct(assesment_id),assesment_name from md_grade_assesment_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'";
 }
 if(req.query.type=="Once"){
   qur1= "select max(distinct(assesment_id)) as assesment_id ,max(assesment_name) as assesment_name  from md_grade_assesment_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'";
 }
 
 
 

 var qur2="select * from subject_assesment_mapping where school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academic_year+"'";
  console.log("-------------");
  console.log(qur);
  console.log(qur1);
  console.log(qur2);
  console.log("-------------");
  var subarr=[];
  var dbarr=[];
  connection.query(qur2, function(err, rows)
    {
    if(!err)
      dbarr=rows;
    connection.query(qur, function(err, rows)
    {
    if(!err)
      subarr=rows;
       connection.query(qur1, function(err, rows)
    {
    if(!err)
    { 
       
      res.status(200).json({'returnval': rows,"subarr":subarr,'dbarr':dbarr});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

    });
   });
 });
});

app.post('/assesmensubjectdbvalue-service',  urlencodedParser,function (req, res)
{
  var qur;

if(req.query.assesmentset=="active"){
   qur="SELECT distinct(category_id) ,grade_id,grade_name,subject_id,subject_name ,category_name FROM subject_category_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"'";

}
if(req.query.assesmentset=="passive"){
 qur="SELECT * FROM subject_category_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"'";


}


 console.log('----Assesment category getvalue-------');
 console.log('----------------------------------------');
 console.log(qur);
 console.log('----------------------------------------');
 connection.query(qur,function(err, rows)
    {
    if(!err)  
    { 
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log('error in this query....'+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/saveassesmentname-service' ,  urlencodedParser,function (req, res)
{
    var data={
       school_id:req.query.school_id,
       academic_year: req.query.academic_year,
       grade_id:req.query.gradeid,
       grade_name:req.query.gradename,
       subject_id:req.query.subjectid,
       subject_name:req.query.subjectname,
       category_id:req.query.categoryid,
       category_name:req.query.categoryname,
       assesment_type:req.query.assesmentname,
       flag:req.query.categoryvalus,
         };
    var qur="select * from subject_category_mapping where school_id='"+req.query.school_id+"' and "+
    "academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' "+
    " and category_id='"+req.query.categoryid+"' and assesment_type='"+req.query.assesmentname+"'";
    console.log('...............subjectto category info info ..........');
    console.log(data);
    console.log('.............. ..........');
    console.log(qur);
    console.log('.............. ..........');

    connection.query(qur, function(err, rows)
      { 
      if(!err)
      {        
      if(rows.length==0)
      {
  connection.query('insert into subject_category_mapping set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
        
    var tempseq1=parseInt((req.query.tempid).substring(1))+1;
      connection.query("UPDATE sequence SET cat_seq='"+tempseq1+"'", function (err,result)
        {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });

      }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
       
      }
      else{ 
     res.status(200).json({'returnval': 'all ready exit'});
     }
}
else
console.log(err);
});
    

});
app.post('/submatricscategoryinsert-service' ,  urlencodedParser,function (req, res)
{
 var data={
       school_id:req.query.school_id,
       academic_year: req.query.academic_year,
       grade_id:req.query.gradeid,
       grade_name:req.query.gradename,
       subject_id:req.query.subjectid,
       category_name:req.query.subjectname,
       category_id:req.query.subsubject,
       sub_category:req.query.categoryname,
       sub_category_id:req.query.categoryid, 
       sub_metrics_id:req.query.subcategoryid,
       sub_metrics:req.query.subcategoryname,
       
         };

     var qur="select * from md_coscholastic_metrics where  subject_id='"+req.query.subjectid+"' "+
    " and sub_category_id='"+req.query.categoryid+"' and sub_metrics_id='"+req.query.subcategoryid+"'and sub_metrics='"+req.query.subcategoryname+"' and category_name='"+req.query.categoryname+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'";
    console.log('...............subjectto category info info ..........');
    console.log(data);
    console.log('.............. ..........');
    console.log(qur);
    console.log('.............. ..........');

    connection.query(qur, function(err, rows)
      { 
      if(!err)
      {        
      if(rows.length==0)
      {
  connection.query('insert into md_coscholastic_metrics set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
        
    var tempseq1=parseInt((req.query.tempid).substring(3))+1;
      connection.query("UPDATE sequence SET subcat_seq='"+tempseq1+"'", function (err,result)
        {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });

      }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
       
      }
      else{ 
     res.status(200).json({'returnval': 'all ready exit'});
     }
}
else
console.log(err);
});
});


app.post('/finalvalueofGenerate-service',  urlencodedParser,function (req, res)
{ 
    var qur="select max(assesment_name) as assesmentname from md_grade_assesment_mapping where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and term_id='"+req.query.termname+"' order by assesment_name";      
    console.log("------------------Fetch FinalGradevalue----------------------");
    console.log(qur);
    connection.query(qur,  function(err, rows)
      {
     if(!err)
      {  
        res.status(200).json({'returnval': rows});
      }  
    });
});
app.post('/savesubassesmentname-service' ,  urlencodedParser,function (req, res)
{
 
 var data={
       school_id:req.query.school_id,
       academic_year: req.query.academic_year,
       grade_id:req.query.gradeid,
       grade_name:req.query.gradename,
       subject_id:req.query.subjectid,
       subject_name:req.query.subjectname,
       category_id:req.query.categoryid,
       category_name:req.query.categoryname, 
       sub_category_id:req.query.subcategoryid,
       sub_category_name:req.query.subcategoryname,
       assesment_type:req.query.assesmentname,
       weight:req.query.mark,
       flag:req.query.categoryvalus,
       sub_seq:req.query.seq,
    
         };
    var qur="select * from subject_mapping where school_id='"+req.query.school_id+"' and "+
    "academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' "+
    " and category_id='"+req.query.categoryid+"' and assesment_type='"+req.query.assesmentname+"'and sub_category_name='"+req.query.subcategoryname+"'";
    var qur4="select assesment_type from assesment_to_type_mapping where  assesment_id ='"+req.query.assesmentname+"'"
    console.log('...............subjectto category info info ..........');
    console.log(data);
    console.log('.............. ..........');
    console.log(qur);
    console.log(qur4);
    console.log('.............. ..........');
    
  
 connection.query(qur4,function(err, rows)
    {
    if(!err)
    { 
       data.type=rows[0].assesment_type;
     
   connection.query(qur, function(err, rows)
      { 
      if(!err)
      {        
      if(rows.length==0)
      {
  connection.query('insert into subject_mapping set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
        
    var tempseq1=parseInt((req.query.tempid).substring(3))+1;
      connection.query("UPDATE sequence SET subcat_seq='"+tempseq1+"'", function (err,result)
        {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });

      }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
       
      }
      else{ 
     res.status(200).json({'returnval': 'all ready exit'});
     }
}
else
console.log(err);
});

 }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});

app.post('/CategoryEditinfo-service',  urlencodedParser,function (req, res)
{

if(req.query.assesmentset=='active'){
var qur=" update   subject_category_mapping set category_name='"+req.
query.categoryname+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"'";

if(req.query.flag=="yes"){
      var qur1="update subject_mapping  set category_name='"+req.
query.categoryname+"'  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"'";
}
if(req.query.flag=="no"){
var qur1="update subject_mapping  set category_name='"+req.
query.categoryname+"',sub_category_name='"+req.
query.categoryname+"'  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and category_id='"+req.query.categoryid+"'";
}


var qur3="select * from subject_category_mapping  where category_name='"+req.
query.categoryname+"'  and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"'";
}
if(req.query.assesmentset=='passive'){

  var qur=" update   subject_category_mapping set category_name='"+req.
query.categoryname+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"' and category_id='"+req.query.categoryid+"'";
if(req.query.flag=="no"){
  var qur1="update subject_mapping  set category_name='"+req.
query.categoryname+"',sub_category_name='"+req.
query.categoryname+"'   where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"' and category_id='"+req.query.categoryid+"'";
}
if(req.query.flag=="yes"){
   var qur1="update subject_mapping  set category_name='"+req.
   query.categoryname+"'  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"' and category_id='"+req.query.categoryid+"'";
}


var qur3="select * from subject_category_mapping  where category_name='"+req.
query.categoryname+"'  and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"'";
}



 console.log('----update-suject-mapping-----------');
 console.log('----------------------------------------');
 console.log(qur);
 console.log(qur1);
 console.log(qur3);
 console.log('----------------------------------------');

connection.query(qur3,function(err, rows)
    {
    if(!err)
    { 

      if(rows.length==0){
      connection.query(qur, function(err, result)
       {
      if(!err)
       connection.query(qur1, function(err, result)
        {
       if(!err)
       { 
        res.status(200).json({'returnval': "Updated"});
       }
      else
       {
          console.log('error in this query....'+err);
          res.status(200).json({'returnval': 'fail'});
      }  

      }); 
    });   
   }
   else
   {
    res.status(200).json({'returnval': "category are Same name"});
   }   
  }
});
});
app.post('/setsubcategoryvalue-service',  urlencodedParser,function (req, res)
{ 
  var qur;
     if(req.query.assesmentset=='active'){
        
       qur="SELECT distinct(sub_category_id),sub_category_name,subject_id,subject_name,grade_id,grade_name,category_id,category_name from subject_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"'  and  category_id='"+req.query.categoryid+"'";
     }

     if(req.query.assesmentset=='passive'){
        qur="SELECT * from subject_mapping where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'  and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmenttype+"' and  category_id='"+req.query.categoryid+"'";
     }
   
 console.log("----------------------------------------");
    console.log(qur);

    connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  
 });
});

app.post('/submatricscategory-service',  urlencodedParser,function (req, res)
{ 
  var qur;
   
  qur="SELECT sub_metrics_id AS sub_category_id ,sub_metrics AS sub_category_name, subject_id, category_name AS subject_name,   sub_category_id as category_id, sub_category as category_name ,grade_id,grade_name from md_coscholastic_metrics where  category_name='"+req.query.subjectname+"' and   sub_category='"+req.query.categoryname+"'and   sub_category_id='"+req.query.categoryid+"' and school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academic_year+"'";
    
   
    console.log("------Sub-matrics---------------------");
    console.log(qur);
    console.log("--------------------------------=----------------");
 connection.query(qur,
      function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  
 });
});


app.post('/CategoryEditinfo1-service',  urlencodedParser,function (req, res)
{ 
  var qur;
   
  qur="update sub_category from md_coscholastic_metrics where  category_name='"+req.query.subjectname+"' and sub_category_id='"+req.query.categoryid+"' subject_id='"+req.query.subjectid+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'";
       console.log("-----------------Sub-matrics edit info---------------------");
       console.log(qur);
       console.log("--------------------------------=----------------");
 connection.query(qur, function(err, rows)
      {
        if(!err)
        {    
          res.status(200).json({'returnval': rows});
        }
        else
        {
          console.log(err);
          res.status(200).json({'returnval': 'fail'});
        }  
 });
});


app.post('/Fnsubcategoryeditinfo-service',  urlencodedParser,function (req, res)
{
var qur1="update md_coscholastic_metrics  set sub_metrics='"+req.query.subcategoryname+"'  where  subject_id='"+req.query.subjectid+"'  and sub_category_id='"+req.query.categoryid+"' and sub_metrics_id='"+req.query.subcategoryid+"' and grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamic_year+"'";

 var qur3="select * from md_coscholastic_metrics  where category_name='"+req.query.subjectname+"' and subject_id='"+req.query.subjectid+"' and sub_category_id='"+req.query.categoryid+"' and sub_metrics='"+req.query.subcategoryname+"' and grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.acadamic_year+"'";

 console.log('----subject-subcategory-mapping-----------');
 console.log('----------------------------------------');
 //console.log(qur);
 console.log(qur1);
 console.log(qur3);
 console.log('----------------------------------------');

connection.query(qur3,function(err, rows)
    {
    if(!err)
    { 

      if(rows.length==0){
      connection.query(qur1, function(err, result)
       {
      
       if(!err)
       { 
        res.status(200).json({'returnval': "Updated"});
       }
      else
       {
           console.log('error in this query....'+err);
          res.status(200).json({'returnval': 'fail'});
       }  
    });   
   }
   else
   {
    res.status(200).json({'returnval': "category are Same name"});
   }   
  }
});
});


app.post('/Fnsubcategoryeditinfo-service',  urlencodedParser,function (req, res)
{
var qur1="update subject_mapping  set sub_category_name='"+req.query.subcategoryname+"'  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"' and category_id='"+req.query.categoryid+"' and sub_category_id='"+req.query.subcategoryid+"'";

 var qur3="select * from subject_mapping  where category_id='"+req.query.categoryid+"'  and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'and subject_id='"+req.query.subjectid+"' and assesment_type='"+req.query.assesmentname+"' and sub_category_name='"+req.query.subcategoryname+"'";

 console.log('----subject-subcategory-mapping-----------');
 console.log('----------------------------------------');
 //console.log(qur);
 console.log(qur1);
 console.log(qur3);
 console.log('----------------------------------------');

connection.query(qur3,function(err, rows)
    {
    if(!err)
    { 

      if(rows.length==0){
      connection.query(qur1, function(err, result)
       {
      
       if(!err)
       { 
        res.status(200).json({'returnval': "Updated"});
       }
      else
       {
           console.log('error in this query....'+err);
          res.status(200).json({'returnval': 'fail'});
       }  
    });   
   }
   else
   {
    res.status(200).json({'returnval': "category are Same name"});
   }   
  }
});
});




app.post('/dashboard-fetchadmissiondashboardinfo-service',  urlencodedParser,function (req, res)
{ 
    if(req.query.zone=="All"&&req.query.branch=="All"){
    var qur="select active_status,admission_status,count(*) as count from mlzscrm.md_admission where academic_year='"+req.query.academicyear+"' "+
    " group by active_status,admission_status";
    }
    if(req.query.zone!="All"&&req.query.branch=="All"){
    var qur="select active_status,admission_status,count(*) as count from mlzscrm.md_admission where academic_year='"+req.query.academicyear+"' "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " group by active_status,admission_status";
    }
    if(req.query.zone!="All"&&req.query.branch!="All"){
    var qur="select active_status,admission_status,count(*) as count from mlzscrm.md_admission where academic_year='"+req.query.academicyear+"' "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " group by active_status,admission_status";
    }
    var qur1="select * from mlzscrm.md_admission_status";
    console.log("------------------admission info----------------------");
    console.log(qur);
    console.log(qur1);
    console.log('------------------------------------------------------');
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        if(!err)
        {
        arr=rows;
        connection.query(qur1,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': arr,'status': rows});
        }
        });
        }
        else
          console.log(err);
        });
});

app.post('/dashboard-fetchcollectiondashboardinfo-service',  urlencodedParser,function (req, res)
{ 
    if(req.query.zone=="All"&&req.query.branch=="All"){
    var paidqur = "select school_id,admission_no,student_name,grade,sum(installment_amount) as paidamount,sum(discount_amount) as discountamount,sum(difference_amount) as diffamount from "+
    " mlzscrm.md_student_paidfee where academic_year='"+req.query.academicyear+"' and paid_status in "+
    " ('paid','cleared','inprogress') and cheque_status not in('bounced','cancelled') "+
    " group by school_id,admission_no,student_name,grade";
    var totalqur = "select * from mlzscrm.md_admission pf join mlzscrm.fee_master m "+
    " on(pf.admission_year=m.admission_year) where pf.academic_year='"+req.query.academicyear+"' "+
    " and pf.academic_year='"+req.query.academicyear+"' and pf.school_id=m.school_id "+
    " and pf.class_for_admission= (select grade_name from mlzscrm.grade_master where grade_id=m.grade_id) and pf.discount_type not in('3') and pf.active_status not in('Cancelled','Withdrawn')"+
    " group by pf.admission_no";
    var discountqur="SELECT school_id,admission_no,sum(discount_amount) as discount_amount FROM mlzscrm.md_student_discount WHERE academic_year='"+req.query.academicyear+"' group by admission_no";
    }
    if(req.query.zone!="All"&&req.query.branch=="All"){
    var paidqur = "select school_id,admission_no,student_name,grade,sum(installment_amount) as paidamount,sum(discount_amount) as discountamount,sum(difference_amount) as diffamount from "+
    " mlzscrm.md_student_paidfee where academic_year='"+req.query.academicyear+"' and paid_status in "+
    " ('paid','cleared','inprogress') and cheque_status not in('bounced','cancelled') "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " group by school_id,admission_no,student_name,grade";
    var totalqur = "select * from mlzscrm.md_admission pf join mlzscrm.fee_master m "+
    " on(pf.admission_year=m.admission_year) where pf.academic_year='"+req.query.academicyear+"' "+
    " and pf.academic_year='"+req.query.academicyear+"' and pf.school_id=m.school_id "+
    " and pf.class_for_admission= (select grade_name from mlzscrm.grade_master where grade_id=m.grade_id) and pf.discount_type not in('3') and pf.active_status not in('Cancelled','Withdrawn')"+
    " and pf.school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " and m.school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " group by pf.admission_no";
    var discountqur="SELECT school_id,admission_no,sum(discount_amount) as discount_amount FROM mlzscrm.md_student_discount WHERE academic_year='"+req.query.academicyear+"' "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " group by admission_no";
    }
    if(req.query.zone!="All"&&req.query.branch!="All"){
    var paidqur = "select school_id,admission_no,student_name,grade,sum(installment_amount) as paidamount,sum(discount_amount) as discountamount,sum(difference_amount) as diffamount from "+
    " mlzscrm.md_student_paidfee where academic_year='"+req.query.academicyear+"' and paid_status in "+
    " ('paid','cleared','inprogress') and cheque_status not in('bounced','cancelled') "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " group by school_id,admission_no,student_name,grade";
    var totalqur = "select * from mlzscrm.md_admission pf join mlzscrm.fee_master m "+
    " on(pf.admission_year=m.admission_year) where pf.academic_year='"+req.query.academicyear+"' "+
    " and pf.academic_year='"+req.query.academicyear+"' and pf.school_id=m.school_id "+
    " and pf.class_for_admission= (select grade_name from mlzscrm.grade_master where grade_id=m.grade_id) and pf.discount_type not in('3') and pf.active_status not in('Cancelled','Withdrawn')"+
    " and pf.school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " and m.school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " group by pf.admission_no";
    var discountqur="SELECT school_id,admission_no,sum(discount_amount) as discount_amount FROM mlzscrm.md_student_discount WHERE academic_year='"+req.query.academicyear+"' "+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " group by admission_no";
    }
    console.log("--------------------collection info--------------------");
    console.log(paidqur);
    console.log(totalqur);
    console.log(discountqur);
    console.log('------------------------------------------------------');
    var paidarr=[];
    var totalarr=[];
    var discountarr=[];
        connection.query(paidqur,  function(err, rows)
        {
        if(!err)
        {
        paidarr=rows;
        connection.query(totalqur,  function(err, rows)
        {
        if(!err)
        {
        totalarr=rows;
        connection.query(discountqur,  function(err, rows)
        {
        if(!err)
        {
        discountarr=rows;
        res.status(200).json({'paidarr': paidarr,'totalarr': totalarr,'discountarr': discountarr});
        }
        });
        }
        });
        }
        else
          console.log(err);
        });
});

app.post('/dashboard-fetchgradewisedashboardinfo-service',  urlencodedParser,function (req, res)
{   
    console.log(req.query.zone+"  "+req.query.branch);
    var qur="";
    if(req.query.zone=="All"&&req.query.branch=="All"){
    console.log('in...'+req.query.zone+"  "+req.query.branch);
    qur="INSERT INTO tr_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,student_id,round(avg(rtotal),1) as total,(SELECT "+
    " grade from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as term_cat_grade,(SELECT rating_id "+
    " from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as id FROM tr_term_assesment_overall_assesmentmarks where "+
    " academic_year='"+req.query.academicyear+"' and term_name='"+req.query.term+"' and subject_id='"+req.query.subject+"' "+
    " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"')"+
    " group by school_id,academic_year,term_name,grade,subject_id,student_id";
    }
    if(req.query.zone!="All"&&req.query.branch=="All"){
    console.log('in in...'+req.query.zone+"  "+req.query.branch);
    qur="INSERT INTO tr_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,student_id,round(avg(rtotal),1) as total,(SELECT "+
    " grade from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as term_cat_grade,(SELECT rating_id "+
    " from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as id FROM tr_term_assesment_overall_assesmentmarks where "+
    " academic_year='"+req.query.academicyear+"' and term_name='"+req.query.term+"' and subject_id='"+req.query.subject+"' "+
    " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"')"+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"')"+
    " group by school_id,academic_year,term_name,grade,subject_id,student_id";
    }
    if(req.query.zone!="All"&&req.query.branch!="All"){
    console.log('in in in...'+req.query.zone+"  "+req.query.branch);
    qur="INSERT INTO tr_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,student_id,round(avg(rtotal),1) as total,(SELECT "+
    " grade from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as term_cat_grade,(SELECT rating_id "+
    " from md_grade_rating where lower_limit<=round(avg(rtotal),1) && higher_limit>= "+
    " round(avg(rtotal),1)) as id FROM tr_term_assesment_overall_assesmentmarks where "+
    " academic_year='"+req.query.academicyear+"' and term_name='"+req.query.term+"' and subject_id='"+req.query.subject+"' "+
    " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"')"+
    " and school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
    " group by school_id,academic_year,term_name,grade,subject_id,student_id";
    }
    var qur1="select id,grade,term_cat_grade,count(student_id) as count from tr_gradewise_dashboard "+
    " group by id,grade,term_cat_grade";
    var qur2="DELETE FROM tr_gradewise_dashboard";
    var qur3="SELECT distinct(grade) as grade from tr_gradewise_dashboard order by grade";
    console.log("--------------------primary info--------------------");
    console.log(qur);
    console.log(qur1);
    console.log(qur2);
    console.log(qur3);
    console.log('------------------------------------------------------');
    var arr=[];
    var gradearr=[];
        connection.query(qur,  function(err, rows)
        {
        if(!err)
        {
        connection.query(qur1,  function(err, rows)
        {
        if(!err)
        {
          arr=rows;
        connection.query(qur3,  function(err, rows)
        {
        if(!err)
        {
          gradearr=rows;
        connection.query(qur2,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': arr,'grade':gradearr});
        }
        else
          console.log("1........."+err);
        });
        }
        else
          console.log("2........."+err);
        });
        }
        else
          console.log("3........."+err);
        });
        }
        else
          console.log("4........."+err);
        });
});

app.post('/dashboard-fetchgradewisedashboardinfo-service1',  urlencodedParser,function (req,res)
{  
  var qur="";
  if(req.query.zone=="All"&&req.query.branch=="All"){
  qur="insert into tr_fa_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,assesment_id,student_id,sum(CAST(mark AS CHAR))as total FROM "+
  " tr_term_fa_assesment_marks WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.term+"') and subject_id='"+req.query.subject+"' "+
  " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"') group by school_id,term_name,assesment_id, "+
  " subject_id,student_id,grade order by school_id,academic_year,term_name,grade,subject_id";
  }
  if(req.query.zone!="All"&&req.query.branch=="All"){
  qur="insert into tr_fa_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,assesment_id,student_id,sum(CAST(mark AS CHAR))as total FROM "+
  " tr_term_fa_assesment_marks WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.term+"') and subject_id='"+req.query.subject+"' "+
  " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"') "+
  " and school_id in(select id from md_school where zone='"+req.query.zone+"')"+
  " group by school_id,term_name,assesment_id, "+
  " subject_id,student_id,grade order by school_id,academic_year,term_name,grade,subject_id";
  }
  if(req.query.zone!="All"&&req.query.branch!="All"){
  qur="insert into tr_fa_gradewise_dashboard SELECT school_id,academic_year,term_name,grade,subject_id,assesment_id,student_id,sum(CAST(mark AS CHAR))as total FROM "+
  " tr_term_fa_assesment_marks WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.term+"') and subject_id='"+req.query.subject+"' "+
  " and grade in (select grade_name from md_school_grade_mapping_dummy where school_type='"+req.query.schooltype+"') "+
  " and school_id in(select id from md_school where zone='"+req.query.zone+"' and id='"+req.query.branch+"')"+
  " group by school_id,term_name,assesment_id, "+
  " subject_id,student_id,grade order by school_id,academic_year,term_name,grade,subject_id";
  }
  var qur1="insert into tr_fa_gradewise_overall_dashboard SELECT d.school_id,d.academic_year,d.term_name,d.grade,d.student_id,d.subject_id,d.assesment_id,d.total, "+
  " s.scale_type,s.scalar,CASE WHEN s.scale_type = '/' THEN d.total/s.scalar WHEN s.scale_type = '*' THEN d.total*s.scalar "+
  " ELSE '0' END as rtotal from tr_fa_gradewise_dashboard d join scaledown_master s on(d.grade=s.grade_name) where "+
  " d.academic_year=s.academic_year and d.term_name=s.term_name and d.subject_id=s.subject_name and "+
  " d.assesment_id=s.assesment_type and d.subject_id='"+req.query.subject+"'";
  if(req.query.term=="Quartely"||req.query.term=="Half Yearly"||req.query.term=="Pre-Annual")
  var qur2="insert into tr_fa_gradewise_grade_dashboard select school_id,grade,subject_id,student_id,(sum(rtotal)*5) as total,(SELECT "+
  " grade from newformat_scholastic_grademaster where lower_limit<=round((sum(rtotal)*5),1) && upper_limit>= "+
  " round((sum(rtotal)*5),1)) as term_cat_grade,(SELECT id from newformat_scholastic_grademaster where lower_limit<=round((sum(rtotal)*5),1) && upper_limit>= "+
  " round((sum(rtotal)*5),1)) as id from tr_fa_gradewise_overall_dashboard group by school_id,grade,subject_id,student_id";
  else
  var qur2="insert into tr_fa_gradewise_grade_dashboard select school_id,grade,subject_id,student_id,sum(rtotal) as total,(SELECT "+
  " grade from newformat_scholastic_grademaster where lower_limit<=round(sum(rtotal),1) && upper_limit>= "+
  " round(sum(rtotal),1)) as term_cat_grade,(SELECT id from newformat_scholastic_grademaster where lower_limit<=round(sum(rtotal),1) && upper_limit>= "+
  " round(sum(rtotal),1)) as id from tr_fa_gradewise_overall_dashboard group by school_id,grade,subject_id,student_id";
  var qur3="select grade,subject_id,id,term_cat_grade,count(student_id) as count from tr_fa_gradewise_grade_dashboard where subject_id='"+req.query.subject+"'"+
  " group by grade,term_cat_grade,subject_id,id order by id,term_cat_grade,grade,subject_id";
  var qur5="DELETE FROM tr_fa_gradewise_dashboard";
  var qur6="DELETE FROM tr_fa_gradewise_overall_dashboard";
  var qur7="DELETE FROM tr_fa_gradewise_grade_dashboard";
  var qur4="SELECT distinct(grade) as grade from tr_fa_gradewise_grade_dashboard order by grade";
  console.log('--------------------high info--------------------');
  console.log(qur);
  console.log(qur1);
  console.log(qur2);
  console.log(qur3);
  console.log(qur4);
  console.log(qur5);
  console.log(qur6);
  console.log('------------------------------------------------------');
  var arr=[];
  var grade=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    connection.query(qur1,function(err, rows){
    if(!err)
    {
    connection.query(qur2,function(err, rows){
    if(!err)
    {
    connection.query(qur3,function(err, rows){
    if(!err)
    {
      arr=rows;
    connection.query(qur4,function(err, rows){
    if(!err)
    {
      grade=rows;
    connection.query(qur5,function(err, rows){
    if(!err)
    {
    connection.query(qur6,function(err, rows){
    if(!err)
    {
    connection.query(qur7,function(err, rows){
    if(!err)
    {
    res.status(200).json({'returnval':arr,'grade':grade});
    }
    else
      console.log("1........."+err);
    });
    }
    else
      console.log("2........."+err);
    });
    }
    else
      console.log("3........."+err);
    });  
    }
    else
      console.log("4........."+err);
    });
    }
    else
      console.log("5........."+err);
    });
    }
    else
      console.log("6........."+err);
    });
    }
    else
      console.log("7........."+err);
    });
  }
  else{
    console.log(err);
    res.status(200).json({'returnval': ''});
  }
  });
});

app.post('/dashboard-fetchdashboardschooltype-service',  urlencodedParser,function (req, res)
{ 
    var qur="select * from md_school_type";
    console.log("----------------------------------------");
    console.log(qur);
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'schooltype': rows});
        }
        });
});

app.post('/dashboard-fetchdashboardterm-service',  urlencodedParser,function (req, res)
{ 
    var qur="select distinct(term_id) as term_id,term_name from md_grade_assesment_mapping where school_type='"+req.query.schooltype+"'";
    console.log("----------------------------------------");
    console.log(qur);
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'returnval': rows});
        }
        });
});

app.post('/dashboard-fetchdashboardsubject-service',  urlencodedParser,function (req, res)
{ 
    var qur="select distinct(subject_name) from subject_mapping where school_type='"+req.query.schooltype+"' and subject_name in(select subject_name from md_subject where subject_category='category1') order by subject_name";
    console.log("----------------------------------------");
    console.log(qur);
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        arr=rows;
        if(!err)
        {
        res.status(200).json({'returnval': rows});
        }
        else
          console.log(err);
        });
});

app.post('/dashboard-fetchdashboardzone-service',  urlencodedParser,function (req, res)
{ 
    var qur="select distinct(zone) from md_school";
    console.log("----------------------------------------");
    console.log(qur);
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        arr=rows;
        if(!err)
        {
        res.status(200).json({'returnval': rows});
        }
        else
          console.log(err);
        });
});

app.post('/dashboard-fetchdashboardbranch-service',  urlencodedParser,function (req, res)
{ 
    var qur="select distinct(id),name from md_school where zone='"+req.query.zone+"'";
    console.log("----------------------------------------");
    console.log(qur);
    var arr=[];
        connection.query(qur,  function(err, rows)
        {
        arr=rows;
        if(!err)
        {
        res.status(200).json({'returnval': rows});
        }
        else
          console.log(err);
        });
});


app.post('/performance-fetchexcelassesmentinfo-service',  urlencodedParser,function (req, res)
{ 
    var qur1="SELECT assesment_type,count(distinct(subject_id)) as subcount,count(distinct(category_id)) as catcount, "+
    " count(distinct(sub_category_id)) as subcatcount FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and assesment_type in(select distinct(assesment_id) "+
    " from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_id='"+req.query.grade+"') group by assesment_type order by assesment_type";

    var qur2="SELECT assesment_type,subject_id,subject_name,count(distinct(subject_id)) as subcount,count(distinct(category_id)) as catcount, "+
    " count(distinct(sub_category_id)) as subcatcount FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and assesment_type in(select distinct(assesment_id) "+
    " from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_id='"+req.query.grade+"') group by assesment_type,subject_id,subject_name order by assesment_type,subject_id";

    var qur3="SELECT assesment_type,subject_id,subject_name,category_id,category_name,count(distinct(subject_id)) as subcount,count(distinct(category_id)) as catcount, "+
    " count(distinct(sub_category_id)) as subcatcount FROM enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' and assesment_type in(select distinct(assesment_id) "+
    " from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
    " grade_id='"+req.query.grade+"') group by assesment_type,subject_id,subject_name,category_id,category_name order by assesment_type,subject_id,category_id";

    var qur4="SELECT assesment_type,subject_id,subject_name,category_id,category_name,sub_category_id,sub_category_name FROM "+
    " enrichment_subject_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and grade_name='"+req.query.grade+"' "+
    " and assesment_type in(select distinct(assesment_id) from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' "+
    " and academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.grade+"') group by assesment_type,subject_id,subject_name,category_id,category_name,sub_category_id,sub_category_name order by assesment_type,subject_id,category_id,sub_category_id";

    var qur5="select * from tr_beginner_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
    " and grade_id='"+req.query.grade+"' and section_id='"+req.query.sectionname+"' and student_id in(select id from md_student where class_id "+
    " in(select id from md_class_section where class='"+req.query.grade+"' and section='"+req.query.sectionname+"' and flag='active'))";

    var qur6="select * from md_student where class_id in(select id from md_class_section where class='"+req.query.grade+"' and section='"+req.query.sectionname+"' and flag='active') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";

    console.log("---------------------excel performace tracking-------------------");
    console.log(qur1);
    console.log(qur2);
    console.log(qur3);
    console.log(qur4);
    console.log(qur5);
    console.log(qur6);
    var typearr=[];
    var subarr=[];
    var catarr=[];
    var subcatarr=[];
    var enricharr=[];
        connection.query(qur1,  function(err, rows)
        {
        typearr=rows;
        if(!err)
        {
        connection.query(qur2,  function(err, rows)
        {
        if(!err)
        {
        subarr=rows;
        connection.query(qur3,  function(err, rows)
        {
        if(!err)
        {
        catarr=rows;
        connection.query(qur4,  function(err, rows)
        {
        if(!err)
        {
        subcatarr=rows;
        connection.query(qur5,  function(err, rows)
        {
        if(!err)
        {
        enricharr=rows;
        connection.query(qur6,  function(err, rows)
        {
        if(!err)
        {
        res.status(200).json({'assesment':typearr,'subject':subarr,'category':catarr,'subcategory':subcatarr,'enrich':enricharr,'student':rows});
        }
        else
          console.log(err);
        });
        }
        else
          console.log('1....'+err);
        });
        }
        else
          console.log('2....'+err);
        });
        }
        else
          console.log('3....'+err);
        });
        }
        else
          console.log('4....'+err);
        });
        }
        else
          console.log('5....'+err);
        });
});

app.post('/fetchnewformatscholasticsubjects-service3',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade,term_name,subject_id,assesment_id,student_id,sum(mark) as total FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' and term_name in(select term_name from md_term "+
  // " where id <=(select id from md_term where term='"+req.query.termname+"')) group by term_name,assesment_id,subject_id,student_id,grade order by term_name,subject_id";
  var createqur="INSERT INTO tr_fa_overall SELECT grade,(select distinct(type) from subject_mapping where assesment_type=assesment_id) as type,category,subject_id,student_id, "+
  " MAX(CAST(mark as DECIMAL(9,2))) as total FROM tr_term_fa_assesment_marks  WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' "+
  " AND student_id='"+req.query.studentid+"' and term_name not in('Annual') group by subject_id,(select distinct(type) from subject_mapping where assesment_type=assesment_id), "+
  " category,student_id,grade order by subject_id";
  var qur="select grade,type as assesment_id,subject_id,student_id,sum(total) as total from tr_fa_overall group by grade,type,subject_id,student_id "+
  " order by subject_id";
  var scalequr="SELECT * FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name in('"+req.query.termname+"')";
  var subqur="SELECT distinct(subject_id) FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studentid+"' order by subject_id";
  var gradequr="SELECT * FROM newformat_scholastic_grademaster";
  var scaleup="SELECT sum(actual_scale) as tot,subject_name,grade_name FROM scaledown_master WHERE academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' group by subject_name,grade_name order by subject_id"
  var dropqur="DELETE FROM tr_fa_overall";
  var annualqur="SELECT * FROM tr_term_fa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND academic_year='"+req.query.academicyear+"' "+
  " AND student_id='"+req.query.studentid+"' AND term_name in('Annual')";
  console.log('--------------------fivetoten reportcard fetch--------------------');
  console.log(createqur);
  console.log(qur);
  console.log(dropqur);
  console.log('----------------------------------------');
  console.log(scalequr);
  console.log('----------------------------------------');
  console.log(subqur);
  console.log('----------------------------------------');
  console.log(gradequr);
  console.log('----------------------------------------');
  console.log(scaleup);
  console.log('----------------------------------------');
  console.log(annualqur);
  var assesment=[];
  var master=[];
  var subject=[];
  var grade=[];
  var scaleupp=[];
  var annual=[];
  connection.query(createqur,function(err, rows){
  if(!err)
  { 
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    global.assesmentarrs=rows;
    assesment=rows;
  
    connection.query(scalequr,function(err, rows){
    if(!err)
    {
    master=rows;
    global.masterarrs=rows;
    connection.query(subqur,function(err, rows){
    if(!err)
    {
      global.subjectarrs=rows;
    subject=rows;
    connection.query(gradequr,function(err, rows){
    if(!err)
    {
      global.gradearrs=rows;
    grade=rows;
    connection.query(scaleup,function(err, rows){
    if(!err)
    {
      global.scaleuparrs=rows;
      scaleupp=rows;
    connection.query(annualqur,function(err, rows){
    if(!err)
    {
      console.log(annual);
      // global.annualarrs=rows;
      annual=rows;
    connection.query(dropqur,function(err, rows){
    if(!err)
    {
    res.status(200).json({'annual':annual,'assesment': assesment,'master':master,'subject':subject,'grade':grade,'scaleup':scaleupp});
    }
    else{
      console.log('error in drop'+err);
    }
    });
    }
    else
      console.log('error in annual');
    });
    }
    else
      console.log("err...lastin scholastic"+err);
    });
    }
    else
      console.log("err...last"+err);
    });
    }
    else
      console.log("err...last before"+err);
    });
    }
    else
      console.log(err);
    });
  }
  else{
    console.log(err);
    res.status(200).json({'returnval': ''});
  }
  });
  }
  else{
   console.log('error in table creation...'+err); 
  }
  });
});

app.post('/fetchnewformatcoscholasticsubjects-service3',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT student_id,mark as total,subject_id FROM "+
  // "tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  // "AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' AND term_name='"+req.query.termname+"'"+
  // "group by subject_id";
  var qur="SELECT '"+req.query.termname+"',student_id,MAX(CAST(mark as DECIMAL(9,2))) as total,subject_id FROM tr_coscholastic_assesment_marks WHERE school_id='"+req.query.schoolid+"' "+
  " AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studentid+"' group by '"+req.query.termname+"',subject_id";
  var qur1="select * from md_coscholastic_grade_rating";
  console.log('----------------------------------------');
  console.log(qur);
  var cs=[];
  connection.query(qur,function(err, rows){
  if(!err)
  { 
    cs=rows;
    global.coarrsvalus=rows;
    connection.query(qur1,function(err, rows){
    if(!err)
    {
      global.gradearrss=rows;
    res.status(200).json({'coarr': cs,'gradearr':rows});
    }
    });
  }
  else
    res.status(200).json({'returnval': ''});
  });
});

app.post('/schoolstudentinfo-service',  urlencodedParser,function (req,res)
{  
     var qur="select * from md_student where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and flag='active'";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/fnschoolname-service',  urlencodedParser,function (req,res)
{  
 var qur="select * from md_school where id !='"+req.query.schoolid+"'";
  var qur1="select * from md_academic ";
  var accarr=[];
    connection.query(qur1, function(err, rows)
    {
    if(!err)
    accarr=rows;
   connection.query(qur, function(err, rows)
    {
    if(!err)

    { 
   //  console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows,'accarr':accarr});
    }
    else{
      console.log(err);
      res.status(200).json({'returnval': ''});
    }
    });
  });
});


app.post('/schoolgrade-service',  urlencodedParser,function (req,res)
{  
 var qur="select * from md_school_grade_mapping where school_id ='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"'";
 console.log("----setgrade---")
 console.log(qur);
 console.log("-------")
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/schoolsection-service',  urlencodedParser,function (req,res)
{  
 var qur="select * from mp_grade_section where school_id ='"+req.query.schoolid+"' and academic_year='"+req.query.acadamicyear+"' and grade_id='"+req.query.gradeid+"'";
   console.log("------school section-------");
   console.log(qur);
   console.log("----------");

    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/previousschoolinfo-service',  urlencodedParser,function (req,res)
 {  
    var qur="select * from md_student r  join   md_class_section p  on (r.class_id=p.id)  where r.school_id='"+req.query.schoolid+"' and r.academic_year='"+req.query.academic_year+"' and r.id='"+req.query.stuid+"' and p.school_id='"+req.query.schoolid+"' and p.academic_year='"+req.query.academic_year+"' and r.flag='active'";
   console.log(qur);
   connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});


function setvalue(){
  console.log("calling setvalue.....");
}
// var server = app.listen(5000, '192.168.1.123',function () {
// var host = server.address().address;
// var port = server.address().port;
// console.log("Example app listening at http://%s:%s", host, port);
// });
var server = app.listen(5000,function () {
var host = server.address().address;
var port = server.address().port;
console.log("Example app listening at http://%s:%s", host, port);
});

