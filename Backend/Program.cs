using HRMSAPPLICATION.Controllers;
using HRMSAPPLICATION.Models;
internal class Program
{
   
    private static void Main(string[] args)
    {
        var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
       
        var builder = WebApplication.CreateBuilder(args);
        // Add services to the container.
        builder.Services.AddScoped<TokenHandler>();

        builder.Services.AddControllers(options =>
        {
            options.Filters.Add<AuthFilter>();
        });
        builder.Services.AddDbContext<HrmsystemContext>();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "My API", Version = "v1" });
            c.OperationFilter<AddHeaderOperationFilter>();
        });

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(name: MyAllowSpecificOrigins,
                              policy =>
                              {
                                  policy.AllowAnyOrigin()
                                  .AllowAnyHeader()
                                  .AllowAnyMethod();

                              });
        });


        var app = builder.Build();

        // Configure the HTTP request pipeline.
        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Home/Error");
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            app.UseHsts();
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        };


        app.UseHttpsRedirection();
        app.UseStaticFiles();

        app.UseRouting();

        app.UseAuthorization();
        app.UseCors(MyAllowSpecificOrigins);
        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");


        app.Run();
    }
}