const manageForm=document.querySelector('#case-manage-form');
const manageStatus=document.querySelector('#manage-status');
const manageNote=document.querySelector('#manage-note');
const manageSubmit=document.querySelector('#manage-submit');
const manageMessage=document.querySelector('#manage-message');
const manageTitle=document.querySelector('#manage-case-title');
const paramsManage=new URLSearchParams(location.search);
const reference=(paramsManage.get('ref')||'').trim().toUpperCase();
const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
const adminToken=(hashParams.get('token')||'').trim();
if(manageTitle) manageTitle.textContent=reference ? 'Research case '+reference : 'Research case';

if(!reference || !adminToken){
  manageMessage.textContent='This management link is incomplete. Open the exact staff link from the case notification email.';
  manageMessage.dataset.state='error';
  manageForm?.querySelectorAll('input,select,textarea,button').forEach((el)=>el.disabled=true);
}

manageForm?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(!reference || !adminToken || !manageForm.reportValidity()) return;
  const original=manageSubmit.textContent;
  manageSubmit.disabled=true;
  manageSubmit.textContent='Saving…';
  manageMessage.textContent='Updating the submitter-visible case status…';
  manageMessage.dataset.state='';
  try{
    const response=await fetch('/api/case-admin',{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify({reference,adminToken,status:manageStatus.value,publicNote:manageNote.value.trim()})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok || !data.ok) throw new Error(data.error || 'Could not update this case.');
    manageMessage.textContent='Case updated successfully. The submitter will see this status the next time they look up the case.';
    manageMessage.dataset.state='success';
  }catch(error){
    manageMessage.textContent=error.message || 'Could not update this case.';
    manageMessage.dataset.state='error';
  }finally{
    manageSubmit.disabled=false;
    manageSubmit.textContent=original;
  }
});