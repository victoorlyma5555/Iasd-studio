$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class DisplayTopology {
 [DllImport("user32.dll")] static extern int GetDisplayConfigBufferSizes(uint flags, out uint paths, out uint modes);
 [DllImport("user32.dll")] static extern int QueryDisplayConfig(uint flags, ref uint paths, IntPtr path, ref uint modes, IntPtr mode, IntPtr topology);
 [DllImport("user32.dll")] static extern int DisplayConfigGetDeviceInfo(IntPtr request);
 static int I(IntPtr p,int o){return Marshal.ReadInt32(p,o);}
 static string Adapter(IntPtr p,int o){return ((uint)I(p,o+4)).ToString("x8")+((uint)I(p,o)).ToString("x8");}
 static string Name(IntPtr p,int offset,int type,int size,int textOffset,int chars){
  IntPtr r=Marshal.AllocHGlobal(size);
  try{for(int i=0;i<size;i++)Marshal.WriteByte(r,i,0);Marshal.WriteInt32(r,0,type);Marshal.WriteInt32(r,4,size);
   Marshal.WriteInt64(r,8,Marshal.ReadInt64(p,offset));Marshal.WriteInt32(r,16,I(p,offset+8));
   if(DisplayConfigGetDeviceInfo(r)!=0)return "";
   return Marshal.PtrToStringUni(IntPtr.Add(r,textOffset),chars).TrimEnd('\0');
  }finally{Marshal.FreeHGlobal(r);}
 }
 public static object[] Read(){
  for(int attempt=0;attempt<3;attempt++){
   uint pc,mc;int e=GetDisplayConfigBufferSizes(2,out pc,out mc);if(e!=0)throw new Exception("BufferSizes: "+e);
   IntPtr paths=Marshal.AllocHGlobal(checked((int)pc*72)),modes=Marshal.AllocHGlobal(checked((int)mc*64));
   try{
    e=QueryDisplayConfig(2,ref pc,paths,ref mc,modes,IntPtr.Zero);if(e==122)continue;if(e!=0)throw new Exception("QueryDisplayConfig: "+e);
    var result=new List<object>();
    for(int i=0;i<pc;i++){
     IntPtr p=IntPtr.Add(paths,i*72);uint idx=(uint)I(p,12);if(idx>=mc)continue;
     IntPtr m=IntPtr.Add(modes,(int)idx*64);if(I(m,0)!=1)continue;
     result.Add(new {sourceKey=Adapter(p,0)+":"+((uint)I(p,8)),adapterId=Adapter(p,20),targetId=(uint)I(p,28),
      sourceName=Name(p,0,1,84,20,32),name=Name(p,20,2,420,36,64),devicePath=Name(p,20,2,420,164,128),
      technology=I(p,36),rotation=I(p,40),connected=I(p,60)!=0,
      bounds=new {x=I(m,28),y=I(m,32),width=I(m,16),height=I(m,20)},
      refresh=I(p,52)==0?0:(double)(uint)I(p,48)/(uint)I(p,52)});
    }
    return result.ToArray();
   }finally{Marshal.FreeHGlobal(paths);Marshal.FreeHGlobal(modes);}
  }
  throw new Exception("Topologia mudou durante a consulta");
 }
}
'@
ConvertTo-Json -InputObject @([DisplayTopology]::Read()) -Depth 6 -Compress
