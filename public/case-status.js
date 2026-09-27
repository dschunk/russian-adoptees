const statusForm=document.querySelector('#case-status-form');
const refInput=document.querySelector('#case-reference-input');
const emailInput=document.querySelector('#case-email-input');
const submit=document.querySelector('#case-status-submit');
const message=document.querySelector('#case-status-message');
const result=document.querySelector('#case-result');
const refOut=document.querySelector('#case-result-reference');
const statusOut=document.querySelector('#case-result-status');
const submittedOut=document.querySelector('#case-submitted');
const updatedOut=document.querySelector('#case-updated');
const noteOut=document.querySelector('#case-public-note');

const params=new URLSearchParams(location.search);
if(refInput && params.get('ref')) refInput.value=params.get('ref').toUpperCase();

const formatDate=(value)=>{
  if(!value) return '—';
  const date=new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

statusForm?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(!statusForm.reportValidity()) return;
  const original=submit.textContent;
  submit.disabled=true;
  submit.textContent='Checking…';
  message.textContent='Looking up your case…';
  message.dataset.state='';
  result.hidden=true;
  try{
    const response=await fetch('/api/case-status',{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify({reference:refInput.value.trim(),email:emailInput.value.trim()})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok || !data.ok) throw new Error(data.error || 'Case not found.');
    refOut.textContent=data.reference;
    statusOut.textContent=data.status;
    submittedOut.textContent=formatDate(data.submittedAt);
    updatedOut.textContent=formatDate(data.lastUpdatedAt);
    noteOut.textContent=data.publicNote || 'RAO has not posted a public update yet.';
    result.hidden=false;
    message.textContent='Case found.';
    message.dataset.state='success';
  }catch(error){
    message.textContent=error.message || 'We could not find a matching case.';
    message.dataset.state='error';
  }finally{
    submit.disabled=false;
    submit.textContent=original;
  }
});